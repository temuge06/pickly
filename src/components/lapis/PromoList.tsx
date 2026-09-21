"use client";

import { useState } from "react";
import { claimPromo } from "@/lib/actions/promos";
import { track } from "@/lib/analytics/client";
import { PromoCard, type PublicPromo } from "./PromoCard";

/**
 * The promo shelf. A code is SINGLE-USE ACROSS THE WHOLE AUDIENCE: the first
 * tap by anyone — a visitor, a signed-in fan, the creator on their own page —
 * claims it, and from then on every viewer sees the ticket greyed out. That is
 * a fact about the code, so it lives on the row (`promo_code.used_at`) and
 * arrives server-rendered; the tickets that are already claimed sort to the
 * end of the rail on the very first paint.
 *
 * A tap on a live ticket greys it out immediately (the tapper still gets the
 * copy and the shop link — they are the one who took it) and claims it on the
 * server. The claim is guarded in SQL, so if someone else got there first the
 * ticket simply stays grey; the local set only covers the gap until the next
 * server render.
 */
export function PromoList({
  promos,
  labels,
}: {
  promos: PublicPromo[];
  /** Localised on the server and passed down — see LapisPromos. */
  labels: { copy: string; copied: string; code: string; used: string };
}) {
  const [claimedHere, setClaimedHere] = useState<Set<string>>(() => new Set());
  const isUsed = (p: PublicPromo) => p.usedAt != null || claimedHere.has(p.id);

  function onUse(promo: PublicPromo) {
    // Every tap is a click; only the one that claims the code is a "use".
    track("promo_click", { promoId: promo.id, code: promo.code });
    if (isUsed(promo)) return;
    // Grey out after the card's own "Copied" beat, not in the same tick: the
    // ticket is an <a> that must survive this click to navigate, and swapping
    // it for the used <button> mid-event would also re-sort it out from under
    // the visitor's finger.
    setTimeout(() => setClaimedHere((prev) => new Set(prev).add(promo.id)), 1800);
    void claimPromo(promo.id)
      .then(({ claimed }) => {
        if (claimed) track("promo_used", { promoId: promo.id, code: promo.code });
      })
      .catch(() => {
        /* network hiccup — the ticket stays grey here; the row decides next load */
      });
  }

  // Stable partition: live tickets keep the creator's order among themselves,
  // and so do the used ones behind them.
  const ordered = [
    ...promos.filter((p) => !isUsed(p)),
    ...promos.filter((p) => isUsed(p)),
  ];

  return (
    <div className="no-scrollbar flex snap-x snap-mandatory items-start gap-[14px] overflow-x-auto scroll-pl-[12px] px-[12px]">
      {ordered.map((p) => (
        <PromoCard
          key={p.id}
          promo={p}
          used={isUsed(p)}
          onUse={() => onUse(p)}
          copyLabel={labels.copy}
          copiedLabel={labels.copied}
          codeLabel={labels.code}
          usedLabel={labels.used}
        />
      ))}
    </div>
  );
}
