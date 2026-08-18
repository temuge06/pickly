import { Empty, LSection } from "./ui";

/**
 * Collections, READ-ONLY. Creating and deleting them moved to /admin along
 * with the picks they group — a creator can see how their My Picks boxes are
 * organised but not restructure them.
 */
export function LapisCollections({
  collections,
  pickCounts,
}: {
  collections: { id: string; title: string }[];
  pickCounts: Record<string, number>;
}) {
  return (
    <LSection icon="🗂" title="Цуглуулга">
      {collections.length === 0 ? (
        <Empty>Цуглуулга алга.</Empty>
      ) : (
        collections.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-[16px] bg-white/[0.04] px-4 py-3"
          >
            <span className="truncate font-malt text-[14px] font-bold text-[#feedd5]">
              {c.title}
            </span>
            <span className="shrink-0 font-malt text-[12px] font-semibold text-[#feedd5]/45">
              {pickCounts[c.id] ?? 0} пик
            </span>
          </div>
        ))
      )}
    </LSection>
  );
}
