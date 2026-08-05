/**
 * The signature element: every photographic section mounts on one of
 * these. The plaque overlaps the top edge like a hung nameplate; the plank
 * itself gets a top highlight + deep shadow so it reads as lit from above,
 * not just a colored card. Individual item shadows (not one shadow under
 * the whole row) live on the cards themselves — see PickCard/MediaCard.
 */
export function Shelf({
  label,
  sublabel,
  children,
}: {
  label: string;
  sublabel?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="relative px-4">
      <div className="relative">
        <div className="absolute -top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 shadow-[0_4px_10px_-4px_rgba(0,0,0,0.5)]">
          <span className="font-display text-[11px] font-bold uppercase tracking-wide text-shelf">
            {label}
          </span>
        </div>
        {sublabel ? (
          <div className="absolute -top-3 right-1 z-10">{sublabel}</div>
        ) : null}
        <div
          className="rounded-[28px] bg-shelf pt-8 pb-5"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 35%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.55), 0 22px 34px -16px rgba(20,14,20,0.6), 0 2px 4px rgba(20,14,20,0.25)",
          }}
        >
          <div className="no-scrollbar flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-px-4 px-4">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
