/* eslint-disable @next/next/no-img-element */
import { formatMnt } from "@/lib/format";
import { Empty, LSection } from "./ui";

/** Wishlist, READ-ONLY — curated from /admin like the rest of the products. */
export function LapisWishlistManager({
  items,
}: {
  items: {
    id: string;
    title: string;
    imageUrl: string | null;
    priceMnt: number | null;
    note: string | null;
  }[];
}) {
  return (
    <LSection icon="✨" title="Wishlist">
      {items.length === 0 ? (
        <Empty>Хүслийн жагсаалт хоосон.</Empty>
      ) : (
        items.map((w) => (
          <div key={w.id} className="flex gap-3 rounded-[16px] bg-white/[0.04] p-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-white/[0.06]">
              {w.imageUrl ? (
                <img src={w.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-malt text-[14.5px] font-bold text-[#feedd5]">
                {w.title}
              </p>
              {w.priceMnt != null ? (
                <p className="font-malt text-[12px] font-semibold text-[#feedd5]/55">
                  {formatMnt(w.priceMnt)}
                </p>
              ) : null}
              {w.note ? (
                <p className="mt-1 line-clamp-2 font-malt text-[12px] text-[#feedd5]/45">
                  {w.note}
                </p>
              ) : null}
            </div>
          </div>
        ))
      )}
    </LSection>
  );
}
