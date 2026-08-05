import type { activityItem } from "@/db/schema";
import { SpotlySection } from "./SpotlySection";

type Book = typeof activityItem.$inferSelect;

/**
 * НОМ, СОНИН (books) shelf — spotly design language, Figma 391:754.
 * Watermark "УНШЛАА", header (🎵 НОМ, СОНИН). Books render as colored spines
 * (68×100, radius 3 on the outer edge, vertical gradient + inset spine shading,
 * 2px drop shadow) standing on a continuous wooden shelf (7px, #ab7d55→#bf9065).
 * Spine colors cycle through the design's blue/green/gray/red set. Title:
 * Bold 8.5px white; author: SemiBold 7px white/74. SF Pro Rounded → Nunito.
 */

// Exact gradients from Figma nodes 391:756/765/774/783.
const SPINE_GRADIENTS = [
  "linear-gradient(to bottom, #4f78bf, #253859)", // blue
  "linear-gradient(to bottom, #52bf4f, #035f00)", // green
  "linear-gradient(to bottom, #7d7d7d, #343434)", // gray
  "linear-gradient(to bottom, #d00000, #6a0000)", // red
];

function lastWord(s?: string | null): string {
  if (!s) return "";
  const parts = s.trim().split(/\s+/);
  return parts[parts.length - 1] ?? "";
}

export function BookShelf({ books }: { books: Book[] }) {
  if (books.length === 0) return null;

  return (
    <SpotlySection watermark="УНШЛАА" icon="🎵" title="НОМ, СОНИН">
      <div className="no-scrollbar overflow-x-auto px-[20px]">
        <div className="relative inline-flex min-w-full items-end gap-[12px] pb-[9px] pt-[10px]">
          {books.map((book, i) => (
            <div
              key={book.id}
              className="relative h-[100px] w-[68px] shrink-0 drop-shadow-[2px_2px_2px_rgba(0,0,0,0.25)]"
            >
              <div
                className="absolute inset-0 rounded-br-[3px] rounded-tr-[3px]"
                style={{
                  backgroundImage: SPINE_GRADIENTS[i % SPINE_GRADIENTS.length],
                }}
              />
              {/* right-edge spine shading */}
              <div className="absolute inset-0 rounded-br-[3px] rounded-tr-[3px] shadow-[inset_-2px_0px_6.7px_0px_rgba(0,0,0,0.35)]" />
              {/* binding lines near the left edge (Figma Line 5 / Line 6) */}
              <div className="absolute left-0 top-0 h-full w-px bg-black/25" />
              <div className="absolute left-[6px] top-0 h-full w-px bg-black/15" />
              <p className="absolute left-[8px] top-[23px] w-[53px] text-center font-header text-[8.5px] font-bold leading-[9px] text-white">
                {book.title}
              </p>
              <p className="absolute left-[8px] top-[74px] w-[53px] truncate text-center font-header text-[7px] font-semibold leading-[10.5px] text-white/70">
                {lastWord(book.subtitle)}
              </p>
            </div>
          ))}
          {/* continuous wooden shelf under the spines */}
          <div
            aria-hidden
            className="absolute -left-[20px] -right-[20px] bottom-0 h-[7px] shadow-[inset_-2px_0px_6.7px_0px_rgba(0,0,0,0.35)]"
            style={{ backgroundImage: "linear-gradient(to right, #ab7d55, #bf9065)" }}
          />
        </div>
      </div>
    </SpotlySection>
  );
}
