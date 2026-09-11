"use client";

import { useEffect } from "react";
import { startTracking, track } from "@/lib/analytics/client";
import { LINK_KINDS, type LinkKind } from "@/lib/analytics/events";

/**
 * Mounts the visitor tracker for one creator's profile. Renders nothing.
 *
 * Outbound clicks are caught by ONE delegated listener rather than an onClick
 * per anchor: the sections that draw the links are server components, and
 * turning each into a client component to add a handler would ship the whole
 * profile's markup logic to the browser for the sake of a beacon. Instead an
 * anchor opts in with `data-track="<kind>"` (plus an optional
 * `data-track-label`), and this listener reads those off the nearest anchor
 * to whatever was tapped. Promo tickets log themselves — their click already
 * runs in a client component (PromoCard) and carries state this cannot see.
 *
 * Not rendered for the owner: a creator refreshing their own page all
 * afternoon is not an audience, and it would drown the numbers staff read.
 */
export function ProfileAnalytics({ creatorId }: { creatorId: string }) {
  useEffect(() => {
    const stop = startTracking(creatorId);

    function onClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest<HTMLAnchorElement>("a[data-track]");
      if (!anchor) return;
      const kind = anchor.dataset.track;
      if (!isLinkKind(kind)) return;
      track("link_click", {
        kind,
        href: anchor.href,
        label: anchor.dataset.trackLabel ?? anchor.textContent?.trim() ?? undefined,
      });
    }

    // Capture phase, so a handler on the anchor that stops propagation (or a
    // navigation that unloads the page) cannot run before this has queued.
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      stop();
    };
  }, [creatorId]);

  return null;
}

function isLinkKind(value: string | undefined): value is LinkKind {
  return value !== undefined && (LINK_KINDS as readonly string[]).includes(value);
}
