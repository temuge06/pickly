"use client";

import { useState } from "react";

/**
 * One published question, as the two-sided card the mock actually draws
 * (Figma 1208:14888).
 *
 * The previous build flattened both sides onto one face — question on top,
 * answer stacked underneath in smaller type — because a flip needs an
 * affordance the shelf had no room to teach. The design review asked for the
 * flip itself: the front carries ONLY the question, and tapping turns the card
 * over to a face labelled Хариулт.
 *
 * Two consequences fall out of that, both requested in the same review:
 *
 *  - the decorative sparkle is gone. It read as noise at 46px against a flat
 *    card, and its slot is what the question needed in order to start at the
 *    top of the face and be set large enough to read at a glance;
 *  - the card is a <button>, not an <article>. It is now interactive, so it has
 *    to be reachable and operable from the keyboard, and `aria-expanded` is
 *    what tells a screen reader which side is showing.
 *
 * The turn is a real 3D rotation on a preserve-3d wrapper rather than a
 * cross-fade: both faces are always in the DOM (so the answer is present for
 * assistive tech and for search engines) and `backface-visibility: hidden`
 * hides whichever one is facing away.
 */
export function AskCard({
  body,
  answer,
  age,
  questionLabel,
  answerLabel,
  hint,
}: {
  body: string;
  answer: string | null;
  /** "2 өдрийн өмнө" — formatted on the server, where the locale lives. */
  age: string;
  questionLabel: string;
  answerLabel: string;
  hint: string;
}) {
  const [flipped, setFlipped] = useState(false);
  // A card with no answer has nothing on its back, so it stays a flat tile
  // rather than a control that turns over to an empty face.
  const canFlip = Boolean(answer?.trim());

  const faceClass =
    "absolute inset-0 flex flex-col rounded-[13px] px-[15px] pb-[9px] pt-[15px] text-left [backface-visibility:hidden]";
  const faceStyle = {
    background: "var(--t-ask)",
    color: "var(--t-on-ask)",
  } as const;

  return (
    <button
      type="button"
      disabled={!canFlip}
      onClick={() => setFlipped((v) => !v)}
      aria-expanded={canFlip ? flipped : undefined}
      aria-label={canFlip ? `${questionLabel}: ${body}. ${hint}` : undefined}
      className="h-[222px] w-[166px] shrink-0 snap-start [perspective:900px] disabled:cursor-default"
    >
      <div
        className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: flipped ? "rotateY(180deg)" : undefined }}
      >
        {/* Front — the question, and nothing else. */}
        <div className={faceClass} style={faceStyle}>
          <p className="text-[17px] font-bold leading-[1.15] tracking-[-0.34px]">
            {questionLabel}
          </p>
          <p className="mt-[10px] line-clamp-6 text-[15px] italic leading-[1.25] tracking-[-0.3px]">
            “{body}”
          </p>
          <div className="mt-auto flex items-end justify-between gap-[6px]">
            <p className="min-w-0 truncate text-[8.74px] leading-[1.2] tracking-[-0.17px] opacity-70">
              {age}
            </p>
            {canFlip ? (
              // nowrap: "Хариулт харах" wrapped to two lines at 166px wide and
              // pushed itself off the baseline the date sits on.
              <span className="flex shrink-0 items-center gap-[3px] whitespace-nowrap text-[9.5px] font-semibold leading-[1.2] opacity-80">
                {hint}
                <FlipGlyph />
              </span>
            ) : null}
          </div>
        </div>

        {/* Back — pre-rotated, so the parent's 180° turn lands it face-on. */}
        <div
          className={faceClass}
          style={{ ...faceStyle, transform: "rotateY(180deg)" }}
          aria-hidden={!flipped}
        >
          <p className="text-[17px] font-bold leading-[1.15] tracking-[-0.34px]">
            {answerLabel}
          </p>
          <p className="mt-[10px] line-clamp-6 text-[14px] leading-[1.3] tracking-[-0.28px]">
            {answer}
          </p>
          <div className="mt-auto flex items-end justify-end">
            <span className="flex shrink-0 items-center gap-[3px] whitespace-nowrap text-[9.5px] font-semibold leading-[1.2] opacity-80">
              {questionLabel}
              <FlipGlyph />
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

/** Two arrows chasing each other — the universal "turn this over" mark. */
function FlipGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="11"
      height="11"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 9h13a4 4 0 0 1 0 8h-3" />
      <path d="m6 6-3 3 3 3" />
    </svg>
  );
}
