import type { CheerioAPI } from "cheerio";

/** What a domain adapter can contribute. Missing fields fall through to the
 * generic layers. */
export type AdapterResult = {
  title?: string | null;
  brand?: string | null;
  /** Absolute (or page-relative) image URL. */
  imageUrl?: string | null;
  /** Raw price TEXT as found in markup (e.g. "89,000₮") — run through
   * parsePriceText by the pipeline. Use for HTML-selector adapters. */
  priceText?: string | null;
  /** Structured numeric price — use for API adapters that already have a
   * number. Paired with priceCurrency (defaults to MNT). */
  priceAmount?: number | null;
  priceCurrency?: string | null;
};

/** Input handed to an adapter: the parsed HTML of the fetched page (may be a
 * shell) and the final URL after redirects. API adapters ignore `$` and derive
 * their request from `finalUrl`. */
export type AdapterInput = {
  $: CheerioAPI;
  finalUrl: string;
};

/**
 * A per-domain extraction rule for sites where generic JSON-LD/OG parsing
 * fails. Keyed on hostname (www. stripped before matching). An adapter is
 * AUTHORITATIVE for its domain — the pipeline runs it first and its fields win
 * over the generic layers (a site's shell often carries misleading site-level
 * og:image/og:title). May be async: HTML-selector adapters read `$`; API
 * adapters fetch their own JSON endpoint. Must never throw — return {} to fall
 * through. Adding a shop = one file here + one line in ./index.ts.
 */
export type DomainAdapter = {
  /** Hostnames this adapter handles, lowercase, without "www.". */
  hosts: string[];
  extract(input: AdapterInput): AdapterResult | Promise<AdapterResult>;
};
