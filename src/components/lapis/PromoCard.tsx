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
 * The Copy control is an anchor, not a button, on purpose. It has to do two
 * things in one tap — put the code on the clipboard and open the shop so the
 * visitor can paste it. Writing to the clipboard is async, and awaiting it
 * before calling window.open spends the user-gesture budget, which is exactly
 * what popup blockers stop. Letting the browser follow a real link keeps the
 * navigation native and unblockable, and the copy runs alongside it.
 */
export function PromoCard({ promo }: { promo: PublicPromo }) {
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
      {copied ? "Copied" : "Copy"}
    </>
  );

  const copyClass =
    "flex h-[18px] shrink-0 items-center justify-center gap-[3px] rounded-[5px] px-[6px] font-malt text-[8px] font-medium leading-none transition-transform active:scale-95";
  const copyStyle = {
    background: "var(--t-promo-btn)",
    color: "var(--t-promo-on-btn)",
  } as const;

  return (
    <div
      className="relative flex h-[162px] w-[267px] shrink-0 snap-start overflow-hidden rounded-[15px]"
      style={{ background: "var(--t-promo-bg)" }}
    >
      {/* Artwork — 114 of the 267 width, per the spec */}
      <div className="relative h-full w-[114px] shrink-0 overflow-hidden bg-black/10">
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
        <p
          className="truncate text-center font-malt text-[35px] font-bold uppercase leading-[36px] tracking-[-1.75px]"
          style={{ color: "var(--t-promo-headline)" }}
        >
          {promo.headline}
        </p>
        {promo.description ? (
          <p
            className="mt-[2px] line-clamp-2 text-center font-malt text-[8px] font-bold leading-[10px] lowercase"
            style={{ color: "var(--t-promo-text)" }}
          >
            {promo.description}
          </p>
        ) : null}

        <p
          className="mt-auto font-malt text-[8px] font-bold uppercase leading-[12px]"
          style={{ color: "var(--t-promo-text)" }}
        >
          promo code
        </p>
        <div
          className="mt-[2px] flex h-[24px] items-center gap-[6px] rounded-[5px] pl-[8px] pr-[3px]"
          style={{ background: "var(--t-promo-chip)" }}
        >
          <span className="min-w-0 flex-1 truncate font-malt text-[20px] uppercase leading-[24px] text-white">
            {promo.code}
          </span>
          {promo.url ? (
            <a
              href={promo.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={copy}
              className={copyClass}
              style={copyStyle}
              aria-label={`${promo.code} хуулж, сайт руу очих`}
            >
              {copyInner}
            </a>
          ) : (
            <button type="button" onClick={copy} className={copyClass} style={copyStyle} aria-label={`${promo.code} хуулах`}>
              {copyInner}
            </button>
          )}
        </div>
        {promo.expiresAt ? (
          <p
            className="mt-[3px] text-right font-malt text-[8px] uppercase leading-[12px]"
            style={{ color: "var(--t-promo-text)" }}
          >
            {formatExpiry(promo.expiresAt)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
