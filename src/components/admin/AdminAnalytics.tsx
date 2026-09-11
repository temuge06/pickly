import type { CreatorAnalytics } from "@/lib/data/analytics";
import type { LinkKind } from "@/lib/analytics/events";

/**
 * Per-creator visitor numbers for staff. A server component: the aggregates
 * arrive already computed (src/lib/data/analytics.ts) and nothing here is
 * interactive, so shipping it to the browser would buy nothing.
 *
 * Deterministic number formatting throughout (see src/lib/format.ts for why
 * toLocaleString is avoided) — this renders on the server only, but the same
 * helpers keep it safe to hoist into a client tree later.
 */
export function AdminAnalytics({ data }: { data: CreatorAnalytics }) {
  const maxKind = Math.max(1, ...data.clicksByKind.map((k) => k.clicks));
  const maxLink = Math.max(1, ...data.topLinks.map((l) => l.clicks));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Профайл үзэлт" value={formatCount(data.views)} hint={`${formatCount(data.uniqueViewers)} хүн`} />
        <Stat label="Промо дарсан" value={formatCount(data.promos.clicks)} hint={`${formatCount(data.promos.used)} ашигласан`} />
        <Stat label="Дундаж хугацаа" value={formatDuration(data.avgSeconds)} hint="нэг үзэлтэд" />
        <Stat label="Нийт хугацаа" value={formatDuration(data.totalSeconds)} hint="бүх үзэлт" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <SubHead>Промо код</SubHead>
          {data.promos.perCode.length === 0 ? (
            <Empty>Промо код алга.</Empty>
          ) : (
            <table className="w-full border-separate border-spacing-y-1 font-inter text-[13px]">
              <thead>
                <tr className="text-left font-malt text-[10.5px] font-bold uppercase tracking-wide text-white/30">
                  <th className="px-2 py-1 font-bold">Код</th>
                  <th className="px-2 py-1 text-right font-bold">Дарсан</th>
                  <th className="px-2 py-1 text-right font-bold">Ашигласан</th>
                </tr>
              </thead>
              <tbody>
                {data.promos.perCode.map((p) => (
                  <tr key={p.promoId} className="rounded-[8px] bg-white/[0.02]">
                    <td className="rounded-l-[8px] px-2 py-1.5">
                      <span className="rounded-[5px] bg-white/[0.08] px-1.5 py-0.5 font-malt text-[11px] text-white/80">
                        {p.code}
                      </span>
                      {p.headline ? (
                        <span className="ml-2 text-white/45">{p.headline}</span>
                      ) : null}
                      {!p.exists ? (
                        <span className="ml-2 text-[11px] text-white/25">устгасан</span>
                      ) : !p.isActive ? (
                        <span className="ml-2 text-[11px] text-white/25">унтраалттай</span>
                      ) : null}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-white/75">{formatCount(p.clicks)}</td>
                    <td className="rounded-r-[8px] px-2 py-1.5 text-right tabular-nums text-white/75">{formatCount(p.used)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <SubHead>Дарсан холбоос, төрлөөр</SubHead>
            {data.clicksByKind.length === 0 ? (
              <Empty>Одоогоор дарсан холбоос алга.</Empty>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {data.clicksByKind.map((k) => (
                  <Bar key={k.kind} label={KIND_LABELS[k.kind]} value={k.clicks} max={maxKind} />
                ))}
              </ul>
            )}
          </div>

          {data.topLinks.length > 0 ? (
            <div>
              <SubHead>Хамгийн их дарсан</SubHead>
              <ul className="flex flex-col gap-1.5">
                {data.topLinks.map((l) => (
                  <Bar
                    key={`${l.kind}:${l.href}:${l.label}`}
                    label={l.label || l.href || KIND_LABELS[l.kind]}
                    sub={l.href ? hostOf(l.href) : KIND_LABELS[l.kind]}
                    value={l.clicks}
                    max={maxLink}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const KIND_LABELS: Record<LinkKind | "unknown", string> = {
  social: "Сошиал",
  quick_link: "Холбоос",
  campaign: "Баннер",
  pick: "Бараа",
  wishlist: "Хүслийн жагсаалт",
  promo: "Промо",
  unknown: "Бусад",
};

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[12px] border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
      <p className="font-malt text-[10.5px] font-bold uppercase tracking-wide text-white/35">{label}</p>
      <p className="mt-1 font-malt text-[24px] font-extrabold tabular-nums tracking-[-0.5px] text-white">{value}</p>
      {hint ? <p className="font-inter text-[11.5px] text-white/35">{hint}</p> : null}
    </div>
  );
}

function SubHead({ children }: { children: string }) {
  return (
    <p className="mb-2 font-malt text-[11.5px] font-bold uppercase tracking-wide text-white/40">
      {children}
    </p>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="font-inter text-[12.5px] text-white/25">{children}</p>;
}

/** One row of a horizontal bar list — the bar is the number, drawn. */
function Bar({ label, sub, value, max }: { label: string; sub?: string; value: number; max: number }) {
  const pct = Math.max(4, Math.round((value / max) * 100));
  return (
    <li className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-inter text-[13px] text-white/80">{label}</span>
          <span className="shrink-0 font-inter text-[12px] tabular-nums text-white/50">{formatCount(value)}</span>
        </div>
        {sub ? <p className="truncate font-inter text-[11px] text-white/30">{sub}</p> : null}
        <div className="mt-1 h-[6px] overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-[#fe7f42]" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </li>
  );
}

function formatCount(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** "1м 24с", "2ц 05м", "38с". Zero reads as a dash — "0с" looks like a bug. */
function formatDuration(seconds: number): string {
  if (seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}ц ${String(m).padStart(2, "0")}м`;
  if (m > 0) return `${m}м ${String(s).padStart(2, "0")}с`;
  return `${s}с`;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
