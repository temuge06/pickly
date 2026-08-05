/**
 * Section header — spotly design language, Figma node 391:682.
 * Exact values:
 *   • row: items-center, space-between, px 20px            (391:682)
 *   • icon + title: 8px gap                                (391:683)
 *   • title: Nunito Black (900), 16px, leading 24px, #151515 (391:687)
 *   • emoji icon: 17px                                     (391:685)
 *   • "See all": Nunito Bold (700), 12px, #e94f7a + chevron (391:689/690)
 */
export function SpotlySectionHead({
  icon,
  title,
  seeAllHref,
}: {
  icon: string;
  title: string;
  seeAllHref?: string;
}) {
  return (
    <div className="flex items-center justify-between px-[20px]">
      <div className="flex items-center gap-[8px]">
        <span className="text-[17px] leading-[17px]" aria-hidden>
          {icon}
        </span>
        <h2 className="font-header text-[16px] font-black leading-[24px] text-spotly-ink">
          {title}
        </h2>
      </div>
      {seeAllHref ? (
        <a
          href={seeAllHref}
          className="flex items-center gap-[2px] font-header text-[12px] font-bold text-spotly-accent"
        >
          See all
          <ChevronRight />
        </a>
      ) : (
        <span className="flex items-center gap-[2px] font-header text-[12px] font-bold text-spotly-accent">
          See all
          <ChevronRight />
        </span>
      )}
    </div>
  );
}

function ChevronRight() {
  // Figma icon 391:690, ~12px, accent color.
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M4.5 2.5 8 6l-3.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
