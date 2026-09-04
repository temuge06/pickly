"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Share this profile — the control the design review asked for beside the bell
 * ("ene buttonii hajuud profile aa share hiideg button nemeh").
 *
 * Two behaviours behind one tap, decided by what the device actually has:
 *
 *   - `navigator.share` where it exists (every phone browser this product is
 *     used on) opens the native sheet, which is what puts the link into
 *     Instagram/Messenger in one gesture;
 *   - otherwise the URL goes on the clipboard and the button says so for a
 *     moment, which is the honest desktop equivalent.
 *
 * The URL is built from the handle rather than read off `location`, so a share
 * from a page reached with query parameters or a trailing slash still sends the
 * clean profile address.
 */
export function ShareButton({
  handle,
  label,
  copiedLabel,
}: {
  handle: string;
  /** Localised on the server and passed down — see FollowButton. */
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function share() {
    const url = `${window.location.origin}/${handle}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `@${handle}`, url });
        return;
      } catch {
        // Dismissing the sheet rejects too, so there is nothing to report and
        // nothing to fall back to — the visitor decided not to share.
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      if (timer.current) clearTimeout(timer.current);
      setCopied(true);
      timer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable (insecure context) — nothing useful to say */
    }
  }

  return (
    <span className="relative flex items-center">
      <button
        type="button"
        onClick={share}
        aria-label={label}
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-[var(--t-accent)] transition-transform active:scale-95"
        style={{ background: "color-mix(in srgb, var(--t-accent) 12%, transparent)" }}
      >
        {/* Node-and-edges share mark rather than the iOS box-and-arrow: the
            latter reads as "open in a new tab" on Android and on desktop. */}
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="18" cy="5" r="2.8" />
          <circle cx="6" cy="12" r="2.8" />
          <circle cx="18" cy="19" r="2.8" />
          <path d="m8.6 10.7 6.8-4M8.6 13.3l6.8 4" />
        </svg>
      </button>
      {copied ? (
        <span
          role="status"
          className="absolute right-0 top-[38px] z-10 whitespace-nowrap rounded-[7px] px-[7px] py-[3px] font-inter text-[11px] font-semibold"
          style={{ background: "var(--t-accent)", color: "var(--t-on-accent)" }}
        >
          {copiedLabel}
        </span>
      ) : null}
    </span>
  );
}
