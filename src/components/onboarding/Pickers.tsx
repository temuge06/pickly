"use client";

import { useState } from "react";
import {
  INTERESTS,
  MAX_INTERESTS,
  MBTI_TEST_URL,
  MBTI_TYPES,
} from "@/lib/personality";
import { Hint, LLabel } from "@/components/dashboard/lapis/ui";

/**
 * The two chip pickers on the signup form.
 *
 * The Figma pins Bumble's "More about me" and "Passions" screens as the
 * pattern to follow (a tap-to-toggle grid with a running count) rather than a
 * LinkSpot design, so these are built in our own language: the auth screens'
 * warm palette, our radii, our type.
 *
 * Both are uncontrolled from the form's point of view — they render hidden
 * inputs — so the parent stays a plain <form action={serverAction}> with no
 * client state to thread through, and a submit carries the selection without
 * any onSubmit handler.
 */

const chipBase =
  "rounded-[10px] border px-[13px] py-[5px] text-[13px] leading-[20px] transition-colors";

/** Single-select: sixteen types, plus a way out for people who don't know. */
export function MbtiPicker({ initial = null }: { initial?: string | null }) {
  const [picked, setPicked] = useState<string | null>(initial);

  return (
    <div className="flex flex-col gap-2">
      <LLabel>Таны зан төлөв (MBTI)</LLabel>
      <div className="flex flex-wrap gap-[6px]">
        {MBTI_TYPES.map((type) => {
          const on = picked === type;
          return (
            <button
              key={type}
              type="button"
              // Tapping the selected chip clears it. Without this the only way
              // to undo a mis-tap on a single-select grid is to reload, since
              // there is no empty option to move back to.
              onClick={() => setPicked(on ? null : type)}
              aria-pressed={on}
              className={`${chipBase} ${
                on
                  ? "border-[#fe7f42] bg-[#fe7f42] font-bold text-[#2a1617]"
                  : "border-white/20 text-[#feedd5]/80 active:bg-white/[0.06]"
              }`}
            >
              {type}
            </button>
          );
        })}
      </div>

      <a
        href={MBTI_TEST_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="w-fit font-malt text-[13px] font-bold text-[#fe7f42] underline underline-offset-2"
      >
        Мэдэхгүй юу? Энд дарж тестээ өг ↗
      </a>
      <Hint>Профайл дээр чинь өнгөтэй тэмдэг болж харагдана. Алгасаж болно.</Hint>

      {/* Empty string when nothing is picked, so the action can tell "skipped"
          from "field absent" and clear a previously saved value. */}
      <input type="hidden" name="mbti" value={picked ?? ""} />
    </div>
  );
}

/** Multi-select, capped, with a live count in the label. */
export function InterestsPicker({ initial = [] }: { initial?: string[] }) {
  const [picked, setPicked] = useState<string[]>(initial);
  const full = picked.length >= MAX_INTERESTS;

  function toggle(key: string) {
    setPicked((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : // Silently ignore taps past the cap rather than dropping the oldest
          // pick: a chip vanishing from the other end of the grid on every tap
          // reads as a bug, not as a limit.
          prev.length >= MAX_INTERESTS
          ? prev
          : [...prev, key],
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <LLabel>
        Сонирхол ({picked.length}/{MAX_INTERESTS})
      </LLabel>
      <div className="flex flex-wrap gap-[6px]">
        {INTERESTS.map((interest) => {
          const on = picked.includes(interest.key);
          return (
            <button
              key={interest.key}
              type="button"
              onClick={() => toggle(interest.key)}
              aria-pressed={on}
              // Unpicked chips dim once the cap is reached, so the limit is
              // visible before it is hit rather than only when a tap does
              // nothing.
              className={`${chipBase} ${
                on
                  ? "border-[#fe7f42] bg-[#fe7f42] font-bold text-[#2a1617]"
                  : full
                    ? "border-white/10 text-[#feedd5]/30"
                    : "border-white/20 text-[#feedd5]/80 active:bg-white/[0.06]"
              }`}
            >
              {interest.mn}
            </button>
          );
        })}
      </div>
      <Hint>Эхний хоёр нь профайл дээр чинь харагдана. Алгасаж болно.</Hint>

      {picked.map((key) => (
        <input key={key} type="hidden" name="interest" value={key} />
      ))}
    </div>
  );
}
