const TRACKING_PARAMS = [
  /^utm_/i,
  /^fbclid$/i,
  /^gclid$/i,
  /^gclsrc$/i,
  /^dclid$/i,
  /^msclkid$/i,
  /^mc_/i,
  /^ref$/i,
  /^ref_/i,
  /^igshid$/i,
  /^_ga$/i,
  /^yclid$/i,
  /^spm$/i,
];

/** Strip tracking/session params. Keeps the meaningful query (product ids). */
export function stripTrackingParams(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.some((re) => re.test(key))) {
        url.searchParams.delete(key);
      }
    }
    // Drop a trailing "?" if we removed everything.
    url.search = url.searchParams.toString();
    return url.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Follow redirects/shorteners to the final URL, then strip tracking. Uses a
 * HEAD-then-GET fallback with a short timeout; on any failure returns the
 * tracking-stripped input so extraction can still try.
 */
export async function canonicalizeUrl(rawUrl: string): Promise<string> {
  const cleaned = stripTrackingParams(rawUrl.trim());
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(cleaned, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": REALISTIC_UA },
    });
    clearTimeout(timeout);
    return stripTrackingParams(res.url || cleaned);
  } catch {
    return cleaned;
  }
}

export const REALISTIC_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
