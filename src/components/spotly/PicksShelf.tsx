import type { pick } from "@/db/schema";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatMnt } from "@/lib/format";
import { SpotlySection } from "./SpotlySection";

type Pick = typeof pick.$inferSelect;
type PickStatus = Pick["status"];

// Light-theme status chips (the dark-theme chips don't fit the white surface).
const STATUS_COPY: Record<PickStatus, string> = {
  testing: "Туршиж байна",
  recommend: "Санал болгоно",
  repurchased: "Дахин авсан",
  wont_rebuy: "Авахгүй",
};
const STATUS_CLASSES: Record<PickStatus, string> = {
  testing: "bg-black/[0.06] text-black/60",
  recommend: "bg-[#2f8f7a]/15 text-[#256b5b]",
  repurchased: "bg-[#e94f7a]/12 text-[#c23361]",
  wont_rebuy: "bg-black/[0.06] text-black/45",
};

/**
 * Picks shelf — spotly light theme adaptation (no Figma frame for Picks).
 * White product cards with the image up top, name/brand/price below, and a
 * quiet status chip, in the design's Nunito + ink/accent language.
 */
export function PicksShelf({
  title,
  watermark,
  picks,
}: {
  title: string;
  watermark: string;
  picks: Pick[];
}) {
  if (picks.length === 0) return null;

  return (
    <SpotlySection watermark={watermark} icon="💛" title={title}>
      <div className="no-scrollbar flex snap-x scroll-pl-[20px] gap-[14px] overflow-x-auto px-[20px]">
        {picks.map((p) => (
          <a
            key={p.id}
            href={p.outboundUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="w-[150px] shrink-0 snap-start"
          >
            <div className="relative aspect-square overflow-hidden rounded-[15px] bg-black/[0.04] shadow-[0_4px_12px_-6px_rgba(0,0,0,0.3)]">
              {p.imageUrl ? (
                <ProductImage src={p.imageUrl} alt={p.title} sizes="150px" />
              ) : null}
              <span
                className={`absolute left-2 top-2 rounded-full px-2 py-0.5 font-header text-[9px] font-bold ${STATUS_CLASSES[p.status]}`}
              >
                {STATUS_COPY[p.status]}
              </span>
            </div>
            <div className="mt-2 px-0.5">
              {p.brand ? (
                <p className="truncate font-header text-[10px] font-semibold uppercase tracking-wide text-black/40">
                  {p.brand}
                </p>
              ) : null}
              <p className="truncate font-header text-[14px] font-bold leading-tight text-spotly-ink">
                {p.title}
              </p>
              {p.priceMnt != null ? (
                <p className="mt-0.5 font-header text-[12px] font-semibold text-black/60">
                  {formatMnt(p.priceMnt)}
                </p>
              ) : null}
              {p.note ? (
                <p className="mt-1 line-clamp-2 font-header text-[12px] leading-snug text-black/55">
                  {p.note}
                </p>
              ) : null}
            </div>
          </a>
        ))}
      </div>
    </SpotlySection>
  );
}
