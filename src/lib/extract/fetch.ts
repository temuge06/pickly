import { REALISTIC_UA } from "./canonicalize";

export type FetchOutcome = {
  ok: boolean;
  status: number;
  finalUrl: string;
  html: string;
  /** Set when the page never yielded usable HTML. */
  error?: "blocked" | "fetch_failed";
};

const BLOCK_MARKERS =
  /cf-chl|challenge-platform|just a moment|verify you are human|access denied|punish\?|_____tmd_____|are you a robot/i;

/**
 * The Facebook link crawler UA. Many SPAs (shoppy.mn and other Mongolian shops
 * among them) can't be read as static HTML, but they DO prerender a clean
 * OpenGraph snippet — title, image, brand, product:price:amount — specifically
 * for this crawler, so social shares get a rich preview. Fetching as this UA
 * turns an unreadable JS shell into a fully structured product record.
 */
export const FACEBOOK_CRAWLER_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

/**
 * Robust page fetch for extraction: realistic UA (override via `userAgent`),
 * ~8s timeout, follows redirects; gzip/br negotiation and decompression are
 * handled by undici (never set Accept-Encoding manually — that can bypass
 * auto-decompression). One quiet retry absorbs transient network hiccups.
 * Distinguishes bot-wall responses ("blocked") from network failures
 * ("fetch_failed"). Never throws.
 */
export async function fetchPage(
  url: string,
  userAgent: string = REALISTIC_UA,
): Promise<FetchOutcome> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
        headers: {
          "User-Agent": userAgent,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "mn-MN,mn;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });

      const html = await res.text().catch(() => "");
      const finalUrl = res.url || url;

      // 403/429 are bot walls. Content markers only count on challenge-sized
      // pages — a full product page mentioning "recaptcha" in a form is not a
      // block (that false positive burned gobicashmere.com in testing).
      const markerBlocked = html.length < 30_000 && BLOCK_MARKERS.test(html);
      if (res.status === 403 || res.status === 429 || markerBlocked) {
        return { ok: false, status: res.status, finalUrl, html, error: "blocked" };
      }
      // Non-OK statuses still return whatever HTML came back — a 404 from an
      // SPA often carries the app shell, which downstream shell-detection uses.
      return { ok: res.ok, status: res.status, finalUrl, html };
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
    }
  }
  return { ok: false, status: 0, finalUrl: url, html: "", error: "fetch_failed" };
}
