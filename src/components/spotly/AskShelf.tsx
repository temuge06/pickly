import type { askMessage } from "@/db/schema";
import { formatRelativeMn } from "@/lib/format";
import { SpotlySection } from "./SpotlySection";
import { Sparkle } from "./icons";

type Ask = typeof askMessage.$inferSelect;

/**
 * Асуулт (questions) shelf — spotly design language, Figma 391:871 / 350:1136.
 * Watermark "АСУУЛАА", header (💬 Асуулт). Each card is 190×254, radius 15, a
 * blue→black radial gradient (from the bright corner, Figma node 350:1136),
 * with a sparkle, an "Асуулт" label, the question in light italic, a relative
 * timestamp, and a "Pinned" chip. SF Pro → Golos (font-body); italic is
 * synthesized since Golos ships upright only.
 */
export function AskShelf({ questions }: { questions: Ask[] }) {
  if (questions.length === 0) return null;

  return (
    <SpotlySection watermark="АСУУЛАА" icon="💬" title="Асуулт">
      <div className="no-scrollbar flex snap-x scroll-pl-[20px] gap-[14px] overflow-x-auto px-[20px]">
        {questions.map((q) => (
          <AskCard key={q.id} question={q.body} createdAt={q.createdAt} />
        ))}
      </div>
    </SpotlySection>
  );
}

function AskCard({
  question,
  createdAt,
}: {
  question: string;
  createdAt: Date;
}) {
  return (
    <div
      className="relative flex h-[254px] w-[190px] shrink-0 snap-start flex-col overflow-hidden rounded-[15px] px-[11px] pb-[8px] pt-[19px]"
      style={{
        backgroundImage:
          "radial-gradient(135% 130% at 12% 100%, #52bdef 0%, #3c89c0 18%, #255591 34%, #1c406d 49%, #132b49 66%, #091524 84%, #000000 100%)",
      }}
    >
      <Sparkle className="mx-auto h-[59px] w-[56px] shrink-0" />
      <p className="mt-[10px] font-body text-[14px] font-light leading-[1.2] tracking-[-0.28px] text-white/90">
        Асуулт
      </p>
      <p className="mt-[6px] font-body text-[18px] italic leading-[0.95] tracking-[-0.36px] text-white line-clamp-5">
        “{question}”
      </p>
      <div className="mt-auto flex items-center justify-between">
        <span className="font-body text-[8px] leading-none tracking-[-0.16px] text-white/85">
          {formatRelativeMn(createdAt)}
        </span>
        <span className="rounded-[3px] bg-white/[0.06] px-[7px] pb-px pt-[2px] font-body text-[8px] leading-none text-white">
          Pinned
        </span>
      </div>
    </div>
  );
}
