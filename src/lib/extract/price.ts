export type ParsedPrice = { amount: number; currency: string };

/**
 * Parse price text as it appears on Mongolian (and international) shop pages:
 *   "89,000₮"  "89000 MNT"  "₮89,000"  "89 000 төг"  "89'000₮"
 *   "89,000.00" (WooCommerce)  "$12.99"  "159 €"
 * Rules:
 *   • NBSP/thin-space and apostrophe thousands separators are normalized.
 *   • ₮ / MNT / төг / төгрөг all mean MNT; MNT amounts round to integer tögrög.
 *   • A trailing 1–2 digit group after . or , is a decimal; every other
 *     separator is thousands grouping.
 *   • Returns null when no plausible number is present — never guesses.
 */
export function parsePriceText(raw: string | null | undefined): ParsedPrice | null {
  if (!raw) return null;
  const text = raw.replace(/[   ]/g, " ").trim();
  if (!text) return null;

  const currency = detectCurrency(text);

  // Widest numeric run (digits plus any separator characters between digits).
  const runs = text.match(/\d[\d.,'’ ]*\d|\d/g);
  if (!runs || !runs[0]) return null;

  // Space-separated chunks only join when they look like thousands groups
  // ("89 000" joins; "4500 5000" — two numbers — does not).
  const parts = runs[0].split(/ +/);
  let num = parts[0]!;
  for (let i = 1; i < parts.length; i++) {
    if (/^\d{3}(?:[.,]\d{1,2})?$/.test(parts[i]!)) num += parts[i]!;
    else break;
  }

  // Trailing 1–2 digit group after . or , = decimals; every other separator
  // is thousands grouping.
  let decimals = "";
  const dec = num.match(/[.,](\d{1,2})$/);
  if (dec) {
    decimals = dec[1]!;
    num = num.slice(0, -dec[0].length);
  }
  const integer = num.replace(/[.,'’]/g, "");
  if (!/^\d+$/.test(integer)) return null;

  let amount = Number.parseFloat(`${integer}.${decimals || "0"}`);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  // Tögrög has no minor unit in practice — integers only.
  if (currency === "MNT") amount = Math.round(amount);

  return { amount, currency: currency ?? "MNT" };
}

/** Currency detection; null when nothing identifiable (caller may default). */
export function detectCurrency(text: string): string | null {
  if (/₮|\bMNT\b|төгрөг|төг(?![а-яөүa-z])/iu.test(text)) return "MNT";
  if (/\$|\bUSD\b/i.test(text)) return "USD";
  if (/€|\bEUR\b/i.test(text)) return "EUR";
  if (/¥|\bJPY\b|\bCNY\b|\bRMB\b/i.test(text)) return "CNY";
  if (/₩|\bKRW\b/i.test(text)) return "KRW";
  if (/₽|\bRUB\b/i.test(text)) return "RUB";
  return null;
}

/**
 * Normalize a structured (JSON-LD / OG) price value + currency code. Values
 * arrive as numbers or strings like "89000.00". No currency → assume nothing;
 * the caller decides. Never guesses a missing value.
 */
export function normalizeStructuredPrice(
  value: unknown,
  currencyCode: string | null | undefined,
): ParsedPrice | null {
  let amount: number | null = null;
  if (typeof value === "number" && Number.isFinite(value)) amount = value;
  else if (typeof value === "string") {
    const parsed = parsePriceText(value);
    if (parsed) amount = parsed.amount;
  }
  if (amount == null || amount <= 0) return null;

  const currency = currencyCode?.trim().toUpperCase() || "MNT";
  return {
    amount: currency === "MNT" ? Math.round(amount) : amount,
    currency,
  };
}
