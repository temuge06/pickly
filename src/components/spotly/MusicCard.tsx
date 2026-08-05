import Image from "next/image";
import { PlayTriangle } from "./icons";

/**
 * Music card — spotly design language, Figma node 391:694.
 * Exact values: card 230×134, radius 10px, shadow 0 4px 4px rgba(0,0,0,0.08),
 * background gradient rgba(255,55,111,0.2)→rgba(255,255,255,0.2) at 111.69°.
 * A CD disc (102px, top −18px) peeks behind the square album cover (102px,
 * rounded 10, at 9,16). Text at x=118: title (Bold 14px #151515, −0.7px),
 * artist (Regular 11px black/50, −0.22px), quote (Light 10px black/75, −0.2px).
 * "Сонсох" pill (391:700): bg black/10, radius 13, h18, play triangle + label
 * (Regular 9px black/75). SF Pro Rounded → Nunito (font-header).
 */
export function MusicCard({
  title,
  artist,
  albumUrl,
  quote,
}: {
  title: string;
  artist?: string | null;
  albumUrl?: string | null;
  quote?: string | null;
}) {
  return (
    <div
      className="relative h-[134px] w-[230px] shrink-0 snap-start rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.08)]"
      style={{
        backgroundImage:
          "linear-gradient(111.69deg, rgba(255,55,111,0.2) 1%, rgba(255,255,255,0.2) 100%)",
      }}
    >
      {/* CD disc peeking behind the cover */}
      <div className="absolute left-[43px] top-[-18px] size-[102px] overflow-hidden rounded-full ring-1 ring-black/5">
        {albumUrl ? (
          <Image src={albumUrl} alt="" fill sizes="102px" className="object-cover" />
        ) : (
          <div className="size-full bg-neutral-300" />
        )}
        <span className="absolute left-1/2 top-1/2 size-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 ring-1 ring-black/10" />
      </div>

      {/* square album cover */}
      <div className="absolute left-[9px] top-[16px] size-[102px] overflow-hidden rounded-[10px] shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
        {albumUrl ? (
          <Image src={albumUrl} alt={title} fill sizes="102px" className="object-cover" />
        ) : null}
      </div>

      <p className="absolute left-[118px] top-[26px] w-[104px] truncate font-header text-[14px] font-bold leading-[15px] tracking-[-0.7px] text-spotly-ink">
        {title}
      </p>
      {artist ? (
        <p className="absolute left-[118px] top-[46px] w-[104px] truncate font-header text-[11px] leading-[13px] tracking-[-0.22px] text-black/50">
          {artist}
        </p>
      ) : null}
      {quote ? (
        <p className="absolute left-[118px] top-[62px] line-clamp-2 w-[100px] font-header text-[10px] font-light leading-[1.1] tracking-[-0.2px] text-black/75">
          “{quote}”
        </p>
      ) : null}

      <div className="absolute left-[130px] top-[100px] flex h-[18px] w-[58px] items-center gap-[4px] rounded-[13px] bg-black/10 px-[6px]">
        <PlayTriangle className="text-black/75" />
        <span className="font-header text-[9px] leading-[9px] tracking-[-0.18px] text-black/75">
          Сонсох
        </span>
      </div>
    </div>
  );
}
