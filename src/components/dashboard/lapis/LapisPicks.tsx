/* eslint-disable @next/next/no-img-element */
import { formatMnt } from "@/lib/format";
import { Empty, Hint, LSection } from "./ui";

/**
 * The creator's own picks, READ-ONLY.
 *
 * Adding, editing and deleting products moved to /admin — Top Picks, My Picks,
 * Wishlist and Not For Me are curated surfaces now, so this shows a creator
 * what is on their profile without offering any control over it. A server
 * component on purpose: with no controls there is nothing to hydrate.
 */

type Pick = {
  id: string;
  title: string;
  brand: string | null;
  imageUrl: string | null;
  priceMnt: number | null;
  note: string | null;
  status: string;
  collectionId: string | null;
};
type Collection = { id: string; title: string };

const STATUS_LABEL: Record<string, string> = {
  testing: "Одоо туршиж байна",
  recommend: "Баттай санал болгоно",
  repurchased: "Дахин авсан",
  wont_rebuy: "Дахин авахгүй",
};

export function LapisPicks({
  picks,
  collections,
  notForMeEnabled = true,
  topPicksEnabled = true,
  myPicksEnabled = true,
}: {
  picks: Pick[];
  collections: Collection[];
  /** A pick whose section is switched off has nowhere to appear, so it is not
   *  listed here either — the dashboard mirrors the public profile exactly. */
  notForMeEnabled?: boolean;
  topPicksEnabled?: boolean;
  myPicksEnabled?: boolean;
}) {
  const visible = picks.filter((p) => {
    if (p.status === "wont_rebuy") return notForMeEnabled;
    return p.collectionId === null ? topPicksEnabled : myPicksEnabled;
  });
  const collectionTitle = new Map(collections.map((c) => [c.id, c.title]));

  return (
    <LSection icon="💛" title="Picks">
      {visible.length === 0 ? (
        <Empty>
          Пик алга. Pickly-ийн баг таны профайлд бараа нэмнэ — хүсэлтээ Ask
          хэсгээр дамжуулж илгээгээрэй.
        </Empty>
      ) : (
        <>
          <Hint>
            Барааг Pickly-ийн баг нэмж, шинэчилдэг. Ask хэсэгт ирсэн барааны
            асуултыг «Бараа болгох» гэж тэмдэглэвэл бидэн рүү очно.
          </Hint>
          {visible.map((p) => (
            <div key={p.id} className="flex gap-3 rounded-[16px] bg-white/[0.04] p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-white/[0.06]">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                {p.brand ? (
                  <p className="truncate font-malt text-[10px] font-bold uppercase tracking-wide text-[#feedd5]/40">
                    {p.brand}
                  </p>
                ) : null}
                <p className="truncate font-malt text-[14.5px] font-bold text-[#feedd5]">
                  {p.title}
                </p>
                {p.priceMnt != null ? (
                  <p className="font-malt text-[12px] font-semibold text-[#feedd5]/55">
                    {formatMnt(p.priceMnt)}
                  </p>
                ) : null}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-[8px] bg-white/[0.06] px-2 py-1 font-malt text-[11px] font-bold text-[#feedd5]/75">
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  {p.collectionId && collectionTitle.has(p.collectionId) ? (
                    <span className="rounded-[8px] bg-white/[0.06] px-2 py-1 font-malt text-[11px] font-bold text-[#feedd5]/75">
                      {collectionTitle.get(p.collectionId)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </LSection>
  );
}
