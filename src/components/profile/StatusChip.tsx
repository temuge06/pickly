import type { pick } from "@/db/schema";

type PickStatus = (typeof pick.$inferSelect)["status"];

const STATUS_COPY: Record<PickStatus, string> = {
  testing: "Одоо туршиж байна",
  recommend: "Баттай санал болгоно",
  repurchased: "Дахин авсан",
  wont_rebuy: "Дахин авахгүй",
};

/**
 * PickCard overlays this on top of arbitrary product photography, so a
 * quiet accent *tint* (fine on the flat `shelf` surface) reads as
 * near-invisible over a busy or dark image. Solid `ink` scrim + a
 * lightened accent text keeps it legible against any photo while staying
 * within the same 6-token accent system — see DESIGN.md.
 */
const STATUS_CLASSES: Record<PickStatus, string> = {
  testing: "bg-ink/85 text-shelf/85",
  recommend: "bg-ink/85 text-[#4fb79f]",
  repurchased: "bg-ink/85 text-marigold",
  wont_rebuy: "bg-ink/85 text-[#c97a88]",
};

export function StatusChip({ status }: { status: PickStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 font-mono text-[10px] font-medium leading-none backdrop-blur-sm ${STATUS_CLASSES[status]}`}
    >
      {STATUS_COPY[status]}
    </span>
  );
}
