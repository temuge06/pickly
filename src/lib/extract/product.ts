import { load, type CheerioAPI } from "cheerio";
import { canonicalizeUrl } from "./canonicalize";
import { FACEBOOK_CRAWLER_UA, fetchPage, type FetchOutcome } from "./fetch";
import { adapterForHost } from "./adapters";
import { normalizeStructuredPrice, parsePriceText } from "./price";

export type ExtractFailureReason = "js_rendered" | "blocked" | "fetch_failed";

export type ExtractedProduct = {
  title: string | null;
  brand: string | null;
  imageUrl: string | null;
  /** Raw numeric price in the source currency (never converted). */
  price: number | null;
  currency: string | null;
  sourceUrl: string;
  /** true when a structured source produced both a title and a price. */
  confident: boolean;
  /** Why extraction came up (mostly) empty — drives the UI message. */
  failureReason: ExtractFailureReason | null;
};

type Partial_ = {
  title?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  currency?: string | null;
};

/**
 * Server-side product extractor. Layered, stopping at the first confident hit:
 *   1. canonicalize (strip tracking params, follow redirects/shorteners)
 *   2. every JSON-LD block → schema.org Product/Offer
 *   3. Open Graph
 *   4. Twitter Card
 *   5. per-domain adapter (registered by hostname)
 *   6. last resort: <title> + largest <img>
 * Never throws and never blocks the creator: any failure returns whatever was
 * found plus a failureReason, and the add-pick form opens pre-filled. Prices
 * are never guessed; non-MNT prices are kept raw for pick.meta.
 */
export async function extractProduct(rawUrl: string): Promise<ExtractedProduct> {
  const sourceUrl = await canonicalizeUrl(rawUrl);
  const empty: ExtractedProduct = {
    title: null,
    brand: null,
    imageUrl: null,
    price: null,
    currency: null,
    sourceUrl,
    confident: false,
    failureReason: null,
  };

  const page = await fetchPage(sourceUrl);
  if (page.error) return { ...empty, failureReason: page.error };
  if (!page.html) return { ...empty, failureReason: "fetch_failed" };

  let best = await runPass(page, sourceUrl);

  // Facebook-crawler fallback: an unreadable JS shell often prerenders a full
  // OpenGraph product snippet for `facebookexternalhit`. Whenever the normal
  // pass isn't confident, retry once as that crawler and keep whichever pass
  // scores richer — a worse FB response can never replace a better normal one,
  // so this only ever helps. This is what makes shoppy.mn (and similar
  // prerendering SPAs) work without a headless browser. (Shell-detection alone
  // was too fragile a trigger — shoppy's shell carries enough footer text to
  // slip past it.)
  if (!best.confident) {
    const fbPage = await fetchPage(sourceUrl, FACEBOOK_CRAWLER_UA);
    if (fbPage.html && !fbPage.error) {
      const fbPass = await runPass(fbPage, sourceUrl);
      if (score(fbPass) > score(best)) best = fbPass;
    }
  }

  return {
    title: best.title,
    brand: best.brand,
    imageUrl: best.imageUrl,
    price: best.price,
    currency: best.currency,
    sourceUrl,
    confident: best.confident,
    failureReason: best.failureReason,
  };
}

type PassResult = {
  title: string | null;
  brand: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  confident: boolean;
  failureReason: ExtractFailureReason | null;
  isShell: boolean;
};

/** Run the full layered extraction over one fetched page. */
async function runPass(
  page: FetchOutcome,
  sourceUrl: string,
): Promise<PassResult> {
  const $ = load(page.html);
  const host = safeHost(page.finalUrl) ?? safeHost(sourceUrl) ?? "";

  const acc: Partial_ = {};
  const merge = (found: Partial_) => {
    for (const key of ["title", "brand", "imageUrl", "price", "currency"] as const) {
      if (acc[key] == null && found[key] != null) {
        (acc as Record<string, unknown>)[key] = found[key];
      }
    }
  };
  const confident = () => Boolean(acc.title && acc.price != null);

  // A domain adapter is AUTHORITATIVE for its host, so it runs first — its
  // fields must win over a shell's misleading site-level og:image / og:title.
  // (No adapter → returns {} instantly.) Then the generic layers, in order,
  // fill any gaps: JSON-LD Product → Open Graph → Twitter → <title>/largest img.
  merge(await fromAdapter($, page.finalUrl, host));
  const jsonLd = fromJsonLd($, page.finalUrl);
  const hadJsonLdProduct = jsonLd.title != null || jsonLd.price != null;
  if (!confident()) merge(jsonLd);
  if (!confident()) merge(fromOpenGraph($, page.finalUrl, host));
  if (!confident()) merge(fromTwitter($, page.finalUrl, host));
  if (!confident()) merge(fromLastResort($, page.finalUrl, host));

  let isConfident = confident();
  const isShell = looksLikeSpaShell($);

  // Shell junk sweep: on a JS shell (or an SPA serving its shell on a 404
  // route), og:title/og:image belong to the SITE, not the product — showing
  // "Emart-Online" + a logo as a pre-filled product misleads the creator. When
  // no structured product data surfaced and the page is a shell, wipe scraps.
  let failureReason: ExtractFailureReason | null = null;
  const noStructuredData = !hadJsonLdProduct && acc.price == null;
  if (noStructuredData && isShell) {
    acc.title = acc.brand = acc.imageUrl = null;
    isConfident = false;
    failureReason = "js_rendered";
  } else if (noStructuredData && !page.ok) {
    acc.title = acc.brand = acc.imageUrl = null;
    isConfident = false;
    failureReason = "fetch_failed";
  } else if (!acc.title && acc.price == null && !acc.imageUrl) {
    failureReason = page.ok ? "js_rendered" : "fetch_failed";
  }

  return {
    title: acc.title ?? null,
    brand: acc.brand ?? null,
    imageUrl: acc.imageUrl ?? null,
    price: acc.price ?? null,
    currency: acc.currency ?? null,
    confident: isConfident,
    failureReason,
    isShell,
  };
}

/** Richness score to compare two passes: price+title beats title beats image. */
function score(r: PassResult): number {
  return (
    (r.title ? 2 : 0) +
    (r.price != null ? 3 : 0) +
    (r.imageUrl ? 1 : 0) +
    (r.brand ? 1 : 0)
  );
}

// ---------------------------------------------------------------------------
// Layer 2: JSON-LD — every block, depth-first for a Product node.
// ---------------------------------------------------------------------------

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

function fromJsonLd($: CheerioAPI, base: string): Partial_ {
  const out: Partial_ = {};
  $('script[type="application/ld+json"]').each((_, el) => {
    if (out.title && out.price != null) return;
    const raw = $(el).text().trim();
    if (!raw) return;
    let parsed: JsonValue;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    const product = findProductNode(parsed);
    if (!product) return;

    const title = firstString(product["name"]);
    const brand = extractBrand(product["brand"]);
    const imageUrl = resolveUrl(imageFrom(product["image"]), base);
    const offer = findOfferNode(product["offers"]);
    let price: number | null = null;
    let currency: string | null = null;
    if (offer) {
      const normalized = normalizeStructuredPrice(
        (offer["price"] ?? offer["lowPrice"]) as unknown,
        firstString(offer["priceCurrency"]),
      );
      if (normalized) ({ amount: price, currency } = normalized);
    }
    if (title && out.title == null) out.title = title;
    if (brand && out.brand == null) out.brand = brand;
    if (imageUrl && out.imageUrl == null) out.imageUrl = imageUrl;
    if (price != null && out.price == null) {
      out.price = price;
      out.currency = currency;
    }
  });
  return out;
}

function isObject(v: JsonValue | undefined): v is { [k: string]: JsonValue } {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function findProductNode(node: JsonValue): { [k: string]: JsonValue } | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findProductNode(item);
      if (found) return found;
    }
    return null;
  }
  if (!isObject(node)) return null;
  const type = node["@type"];
  const types = Array.isArray(type) ? type.map(String) : type != null ? [String(type)] : [];
  if (types.some((t) => t.toLowerCase() === "product")) return node;
  for (const key of ["@graph", "mainEntity", "itemListElement", "item"]) {
    if (key in node) {
      const found = findProductNode(node[key]!);
      if (found) return found;
    }
  }
  return null;
}

function findOfferNode(offers: JsonValue | undefined): { [k: string]: JsonValue } | null {
  if (!offers) return null;
  if (Array.isArray(offers)) {
    for (const o of offers) if (isObject(o)) return o;
    return null;
  }
  return isObject(offers) ? offers : null;
}

function extractBrand(brand: JsonValue | undefined): string | null {
  if (!brand) return null;
  if (typeof brand === "string") return brand.trim() || null;
  if (isObject(brand)) return firstString(brand["name"]);
  return null;
}

function firstString(v: JsonValue | undefined): string | null {
  if (typeof v === "string") return v.trim() || null;
  if (Array.isArray(v)) {
    for (const item of v) {
      const s = firstString(item);
      if (s) return s;
    }
  }
  return null;
}

function imageFrom(image: JsonValue | undefined): string | null {
  if (typeof image === "string") return image;
  if (Array.isArray(image)) return firstString(image);
  if (isObject(image)) return firstString(image["url"] ?? null);
  return null;
}

// ---------------------------------------------------------------------------
// Layers 3–4: Open Graph / Twitter Card.
// ---------------------------------------------------------------------------

function meta($: CheerioAPI, name: string): string | null {
  const v =
    $(`meta[property="${name}"]`).attr("content") ??
    $(`meta[name="${name}"]`).attr("content");
  return v?.trim() || null;
}

function fromOpenGraph($: CheerioAPI, base: string, host: string): Partial_ {
  const out: Partial_ = {};
  out.title = cleanTitle(meta($, "og:title"), host);
  out.imageUrl = resolveUrl(meta($, "og:image"), base);
  out.brand = meta($, "og:brand") ?? meta($, "product:brand");
  const priceStr = meta($, "product:price:amount") ?? meta($, "og:price:amount");
  const currencyStr =
    meta($, "product:price:currency") ?? meta($, "og:price:currency");
  const normalized = priceStr ? normalizeStructuredPrice(priceStr, currencyStr) : null;
  if (normalized) {
    out.price = normalized.amount;
    out.currency = normalized.currency;
  }
  return out;
}

function fromTwitter($: CheerioAPI, base: string, host: string): Partial_ {
  return {
    title: cleanTitle(meta($, "twitter:title"), host),
    imageUrl: resolveUrl(meta($, "twitter:image"), base),
  };
}

// ---------------------------------------------------------------------------
// Layer 5: per-domain adapter.
// ---------------------------------------------------------------------------

async function fromAdapter(
  $: CheerioAPI,
  finalUrl: string,
  host: string,
): Promise<Partial_> {
  const adapter = adapterForHost(host);
  if (!adapter) return {};

  let r;
  try {
    r = await adapter.extract({ $, finalUrl });
  } catch {
    return {}; // adapters must never take the pipeline down.
  }

  const out: Partial_ = {
    title: r.title?.trim() || null,
    brand: r.brand?.trim() || null,
    imageUrl: resolveUrl(r.imageUrl ?? null, finalUrl),
  };
  // Structured numeric price (API adapters) vs. price text (HTML adapters).
  const price =
    r.priceAmount != null
      ? normalizeStructuredPrice(r.priceAmount, r.priceCurrency)
      : parsePriceText(r.priceText);
  if (price) {
    out.price = price.amount;
    out.currency = price.currency;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Layer 6: last resort — <title> + largest <img>.
// ---------------------------------------------------------------------------

function fromLastResort($: CheerioAPI, base: string, host: string): Partial_ {
  const title = cleanTitle($("title").first().text(), host);
  // No title → no image either: a "largest img" from a page we understood
  // nothing about is usually a banner, logo, or captcha asset, and a wrong
  // pre-filled product photo is worse than an empty field.
  if (!title) return {};

  let bestUrl: string | null = null;
  let bestArea = 0;
  $("img").each((_, el) => {
    const src = $(el).attr("src") ?? $(el).attr("data-src");
    if (!src || /logo|icon|sprite|avatar|\.svg/i.test(src)) return;
    const w = Number.parseInt($(el).attr("width") ?? "0", 10);
    const h = Number.parseInt($(el).attr("height") ?? "0", 10);
    const area = w > 0 && h > 0 ? w * h : 1; // undimensioned imgs rank last
    if (area > bestArea) {
      bestArea = area;
      bestUrl = src;
    }
  });

  return { title, imageUrl: resolveUrl(bestUrl, base) };
}

// ---------------------------------------------------------------------------
// Helpers.
// ---------------------------------------------------------------------------

/** Strip site-name suffixes ("X - MMARKET.MN", "X | Shoppy") and reject junk
 * titles that are just the site's own name. */
function cleanTitle(raw: string | null | undefined, host: string): string | null {
  if (!raw) return null;
  let t = raw.replace(/\s+/g, " ").trim();
  if (!t) return null;

  const hostBase = host.replace(/^www\./, "").split(".")[0] ?? "";
  const suffix = t.match(/\s+[-–—|·]\s+([^-–—|·]+)$/);
  if (suffix) {
    const tail = suffix[1]!.trim().toLowerCase();
    const isSiteName =
      tail.includes(hostBase.toLowerCase()) ||
      /\.(mn|com|net)\b/.test(tail) ||
      /(mall|market|shop|store|online)/.test(tail);
    const remainder = t.slice(0, -suffix[0].length).trim();
    if (isSiteName && remainder.length >= 4) t = remainder;
  }

  const low = t.toLowerCase();
  // A one/two-word title built around shop-ish words ("Emart-Online",
  // "Shoppy Store") is the site's name, not a product.
  const words = low.split(/[\s-]+/).filter(Boolean);
  const siteish =
    words.length <= 2 &&
    words.some((w) => /^(mall|market|shop|store|online|home|нүүр)$/.test(w));
  if (
    t.length < 3 ||
    siteish ||
    low === host.toLowerCase() ||
    low === hostBase.toLowerCase() ||
    low === `${hostBase}.mn` ||
    low === "product" ||
    low === "products"
  ) {
    return null;
  }
  return t;
}

/**
 * Rough SPA-shell test. A real product page always carries well over 400
 * chars of visible text (name, price, description, nav); a shell carries
 * almost none regardless of how it mounts. Pages with a known SPA mount node
 * get a looser threshold (their shells sometimes include footer link text).
 */
function looksLikeSpaShell($: CheerioAPI): boolean {
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  if (bodyText.length < 400) return true;
  const hasMount =
    $("#app, #root, #__next, #__nuxt, #q-app, [data-reactroot]").length > 0;
  return hasMount && bodyText.length < 1500;
}

function resolveUrl(url: string | null | undefined, base: string): string | null {
  if (!url) return null;
  try {
    const resolved = new URL(url, base);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") return null;
    return resolved.toString();
  } catch {
    return null;
  }
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
