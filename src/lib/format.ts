// All formatting here is locale- and timezone-independent on purpose.
// `Number.toLocaleString` / `Date.toLocaleDateString` produce different output
// under Node's ICU (server) vs the browser (client), which causes React
// hydration mismatches. We format from raw digits / the UTC ISO string so the
// output is byte-identical on both sides.

/** e.g. 45000 → "45,000₮". Deterministic thousands grouping. */
export function formatMnt(amount: number): string {
  const grouped = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${grouped}₮`;
}

/** "2026.07.31" from the date's UTC parts — same server-side and client-side
 * regardless of either machine's timezone. */
export function formatDateNumeric(date: Date): string {
  const [y, m, d] = new Date(date).toISOString().slice(0, 10).split("-");
  return `${y}.${m}.${d}`;
}

/** Mongolian relative time — "2 цагийн өмнө" etc. Coarse on purpose: a
 * "synced recently" signal doesn't need second-level precision. Note: this
 * reads the current time, so only render it server-side (it's used in the
 * server-rendered SyncPulse) — a client re-render at a later minute would
 * legitimately differ. */
export function formatRelativeMn(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.round(diffMs / (1000 * 60));
  const hours = Math.round(diffMs / (1000 * 60 * 60));
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "дөнгөж сая";
  if (minutes < 60) return `${minutes} минутын өмнө`;
  if (hours < 24) return `${hours} цагийн өмнө`;
  if (days < 30) return `${days} өдрийн өмнө`;
  // Fallback for older items: "2026 оны 7-р сар" (year / month), deterministic.
  const [y, m] = new Date(date).toISOString().slice(0, 7).split("-");
  return `${y} оны ${Number(m)}-р сар`;
}
