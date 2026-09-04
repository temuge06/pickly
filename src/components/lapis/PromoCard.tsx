"use client";

import { useRef, useState } from "react";
import { ProductImage } from "@/components/ui/ProductImage";

export type PublicPromo = {
  id: string;
  headline: string;
  description: string | null;
  code: string;
  url: string | null;
  imageUrl: string | null;
  expiresAt: Date | string | null;
};

/** "EXP. JULY 31, 2026" — the design's uppercase US-style date. */
function formatExpiry(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return `EXP. ${d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })}`.toUpperCase();
}

/**
 * Promo ticket (Figma 1048:8863). Perforated coupon: artwork on the left, the
 * offer and code on the right, with notches punched at the tear line.
 *
 * THE WHOLE TICKET is the control, not the 17px chip in the corner. The review
 * asked for the code to be copied "haana ni c darsan" — wherever you press —
 * and it was right: a coupon is a single object, the chip was the smallest
 * target on the card, and a visitor who tapped the code itself (the one thing
 * they were looking at) got nothing. The chip stays as the affordance that
 * says what the tap will do, and it is now a plain <span>: an interactive
 * element inside the card's own anchor would be invalid HTML and would give
 * the same action two conflicting hit areas.
 *
 * The card is an anchor, not a button, whenever the promo has a shop URL. It
 * has to do two things in one tap — put the code on the clipboard and open the
 * shop so the visitor can paste it. Writing to the clipboard is async, and
 * awaiting it before calling window.open spends the user-gesture budget, which
 * is exactly what popup blockers stop. Letting the browser follow a real link
 * keeps the navigation native and unblockable, and the copy runs alongside it.
 */
export function PromoCard({
  promo,
  copyLabel = "Copy",
  copiedLabel = "Copied",
  codeLabel = "promo code",
}: {
  promo: PublicPromo;
  /** Localised on the server and passed down — see FollowButton. */
  copyLabel?: string;
  copiedLabel?: string;
  codeLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function copy() {
    try {
      void navigator.clipboard?.writeText(promo.code);
    } catch {
      /* clipboard unavailable (insecure context) — the navigation still works */
    }
    if (timer.current) clearTimeout(timer.current);
    setCopied(true);
    timer.current = setTimeout(() => setCopied(false), 1800);
  }

  const copyInner = (
    <>
      {copied ? (
        <svg viewBox="0 0 24 24" className="h-[8px] w-[8px]" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 12.5 L9.5 18 L20 6.5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-[8px] w-[8px]" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden>
          <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
          <path d="M15.5 5.5H6A2.5 2.5 0 0 0 3.5 8v9.5" strokeLinecap="round" />
        </svg>
      )}
      {copied ? copiedLabel : copyLabel}
    </>
  );

  const copyChip = (
    <span
      aria-hidden
      className="flex h-[17px] shrink-0 items-center justify-center gap-[2px] rounded-[5px] px-[5px] text-[9px] font-medium leading-none"
      style={{
        background: "var(--t-promo-btn)",
        color: "var(--t-promo-on-btn)",
      }}
    >
      {copyInner}
    </span>
  );

  const shellClass =
    "relative flex h-[162px] w-[267px] shrink-0 snap-start overflow-hidden rounded-[15px] text-left transition-transform active:scale-[0.985]";
  const shellStyle = { background: "var(--t-promo-bg)" } as const;
  const shellLabel = promo.url
    ? `${promo.headline} — ${promo.code} ${copyLabel.toLowerCase()}`
    : `${promo.code} ${copyLabel.toLowerCase()}`;

  const inner = (
    <>
      {/* Artwork — 114 of the 267 width, per the spec */}
      <div className="relative h-full w-[114px] shrink-0 overflow-hidden rounded-l-[15px] bg-black/10">
        {promo.imageUrl ? (
          <ProductImage src={promo.imageUrl} alt={promo.headline} sizes="114px" />
        ) : null}
      </div>

      {/* Tear line: dashed rule plus a notch punched top and bottom */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[114px] top-0 h-full border-l border-dashed"
        style={{ borderColor: "color-mix(in srgb, var(--t-promo-text) 45%, transparent)" }}
      />
      <span aria-hidden className="pointer-events-none absolute left-[114px] top-0 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--t-bg)]" />
      <span aria-hidden className="pointer-events-none absolute bottom-0 left-[114px] h-[11px] w-[11px] -translate-x-1/2 translate-y-1/2 rounded-full bg-[var(--t-bg)]" />

      {/* Offer + code */}
      {/* 7px gutters, not 12: the spec gives the code chip 140px and the
          headline ~161px, and 12px squeezed both into truncation. */}
      <div className="flex min-w-0 flex-1 flex-col px-[7px] py-[11px]">
        {/* 28px, down from 35: the review asked for the ticket's type to come
            down a couple of steps, and the headline is what pushed a longer
            offer ("Хямдрал 20%") into an ellipsis at the old size. */}
        <p
          className="truncate text-center text-[28px] font-bold uppercase leading-[30px] tracking-[-1.2px]"
          style={{ color: "var(--t-promo-headline)" }}
        >
          {promo.headline}
        </p>
        {promo.description ? (
          <p
            className="mt-[4px] line-clamp-2 text-[12px] leading-[13px]"
            style={{ color: "var(--t-promo-text)" }}
          >
            {promo.description}
          </p>
        ) : null}

        <p
          className="mt-auto text-[11px] font-bold uppercase leading-[17px]"
          style={{ color: "var(--t-promo-text)" }}
        >
          {codeLabel}
        </p>
        {/* The code is the one thing on this card a visitor has to be able to
            READ before they tap Copy, and at 20px only about three characters
            of a real code cleared the chip before the ellipsis — the review
            asked for five or six. 14px on a chip with tighter gutters fits
            eight, so ordinary codes ("ANU10", "SARNAI20") land whole. */}
        <div
          className="mt-[2px] flex h-[22px] items-center gap-[4px] rounded-[5px] pl-[6px] pr-[3px]"
          style={{ background: "var(--t-promo-chip)" }}
        >
          <span
            className="min-w-0 flex-1 truncate text-[14px] font-semibold uppercase leading-[22px] tracking-[-0.2px]"
            style={{ color: "var(--t-promo-on-chip)" }}
          >
            {promo.code}
          </span>
          {copyChip}
        </div>
        {promo.expiresAt ? (
          <p
            className="mt-[3px] text-right text-[9px] uppercase leading-[16px]"
            style={{ color: "var(--t-promo-text)" }}
          >
            {formatExpiry(promo.expiresAt)}
          </p>
        ) : null}
      </div>
    </>
  );

  return promo.url ? (
    <a
      href={promo.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={copy}
      aria-label={shellLabel}
      className={shellClass}
      style={shellStyle}
    >
      {inner}
    </a>
  ) : (
    <button
      type="button"
      onClick={copy}
      aria-label={shellLabel}
      className={shellClass}
      style={shellStyle}
    >
      {inner}
    </button>
  );
}
