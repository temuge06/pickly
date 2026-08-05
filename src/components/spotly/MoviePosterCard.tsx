import Image from "next/image";

/**
 * Movie card — spotly design language, Figma frame 391-680 (Кино shelf).
 * Exact values pulled from the Figma node, not estimated:
 *   • card 179×265, corner radius 15px, overflow hidden        (391:821)
 *   • poster fills the card (object-cover)                     (391:822)
 *   • title: 11px, white, tracking −0.22px, leading 1.04,
 *     bottom-left inset 14px, in the condensed face           (391:824)
 *   • rating: 15px, white, tracking −0.30px, top / right       (391:825)
 *
 * Type note: Figma specifies SF Pro Condensed Medium, which is an Apple
 * system typeface and can't be web-served. `font-condensed` maps to PT Sans
 * Narrow — the one genuinely condensed Google font with Cyrillic coverage,
 * which the Mongolian titles (e.g. "Мэргэн") require. Weight 700 stands in for
 * the Medium (540) cut so 11px white-on-photo stays legible.
 *
 * The bottom scrim reproduces the design's dark bottom fade (a radial at 0.42
 * black in Figma) as a clean linear scrim — the visual goal is a darkened
 * lower third for text legibility; a full-card 2px backdrop-blur from the
 * export was dropped because it would soften the whole poster, which the
 * design render shows crisp.
 */
export function MoviePosterCard({
  title,
  rating,
  posterUrl,
}: {
  title: string;
  rating?: number | null;
  posterUrl?: string | null;
}) {
  return (
    <div className="relative h-[265px] w-[179px] shrink-0 snap-start overflow-hidden rounded-[15px] bg-spotly-bg">
      {posterUrl ? (
        <Image
          src={posterUrl}
          alt={title}
          fill
          sizes="179px"
          className="object-cover"
        />
      ) : null}

      {/* bottom scrim for legibility */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 45%)",
        }}
      />

      {rating != null ? (
        <span className="absolute right-[7px] top-[13px] w-[24px] text-center font-condensed text-[15px] font-bold leading-[1.04] tracking-[-0.3px] text-white">
          {rating.toFixed(1)}
        </span>
      ) : null}

      <p className="absolute bottom-[22px] left-[14px] w-[75px] font-condensed text-[11px] font-bold leading-[1.04] tracking-[-0.22px] text-white">
        {title}
      </p>
    </div>
  );
}
