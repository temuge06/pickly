import "dotenv/config";
import { writeFileSync } from "node:fs";
import { extractProduct } from "./product";

/**
 * Extraction test harness. Runs the extractor against a URL list and prints a
 * markdown table + writes raw JSON for before/after comparison.
 *
 * Usage:
 *   npx tsx src/lib/extract/harness.ts [outfile.json] [urls.txt]
 *
 * With no urls.txt, uses the built-in representative set of Mongolian
 * e-commerce URLs. Swap in the real creator-supplied list any time.
 */
const DEFAULT_URLS = [
  // Server-rendered Mongolian shops
  "https://mmarket.mn/product/blackpink-1st-full-album-the-album/",
  // Same shop, littered with tracking params — canonicalization test
  "https://mmarket.mn/product/blackpink-thealbum-hoodie/?utm_source=instagram&utm_medium=bio&fbclid=IwAR123test",
  "https://www.gobicashmere.com/products/basic-crew-neck-sweater-beige/",
  // SPA that serves HTTP 404 + app shell for product routes
  "https://nomin.mn/p/1340057",
  // Category page, products injected by JS
  "https://itzone.mn/mn/product",
  // Pure SPA shells (static HTML has no product data)
  "https://shoppy.mn/product/iphone-15-pro",
  "https://emartmall.mn/",
  "https://cody.mn/",
  "https://lhamour.mn/",
  // Cloudflare bot-blocked
  "https://www.unegui.mn/",
  "https://www.iherb.com/pr/cosrx-advanced-snail-96-mucin-power-essence-3-38-fl-oz-100-ml/62018",
  "https://www.aliexpress.com/item/1005006266863350.html",
];

async function main() {
  const outFile = process.argv[2] ?? "extract-results.json";
  const urlFile = process.argv[3];
  const urls = urlFile
    ? (await import("node:fs")).readFileSync(urlFile, "utf-8").split("\n").map((l) => l.trim()).filter(Boolean)
    : DEFAULT_URLS;

  const results = [];
  for (const url of urls) {
    const started = Date.now();
    const r = await extractProduct(url);
    const ms = Date.now() - started;
    results.push({ input: url, ms, ...r });
    const host = new URL(url).hostname.replace(/^www\./, "");
    console.log(
      `| ${host} | ${fmt(r.title, 34)} | ${r.price != null ? `${r.price} ${r.currency ?? "?"}` : "—"} | ${r.imageUrl ? "✓" : "—"} | ${fmt(r.brand, 12)} | ${r.confident ? "yes" : "no"} | ${"failureReason" in r && (r as Record<string, unknown>).failureReason ? (r as Record<string, unknown>).failureReason : ""} |`,
    );
  }
  writeFileSync(outFile, JSON.stringify(results, null, 2));
  console.log(`\nSaved ${results.length} results → ${outFile}`);
}

function fmt(v: string | null | undefined, max: number): string {
  if (!v) return "—";
  const clean = v.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
