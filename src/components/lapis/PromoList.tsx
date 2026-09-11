"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics/client";
import { PromoCard, type PublicPromo } from "./PromoCard";

/**
 * "Used" is a fact about this visitor, not about the code, so it lives in the
 * browser: one localStorage key per promo id, set the first time the ticket is
 * tapped. The row in the database is untouched and every other visitor still
 * sees the ticket live. Anyone can clear it — that is fine, it is a courtesy
 * to the visitor ("you already grabbed this one"), not a redemption limit.
 *
 * Keyed by promo id alone, not by viewer: a signed-in creator browsing on a
 * friend's phone would otherwise un-grey everything, and the analytics row
 * already attributes the tap to the right account server-side.
 */
const KEY_PREFIX = "linkspot_promo_used:";

function readUsed(ids: string[]): Set<string> {
  const used = new Set<string>();
  try {
    for (const id of ids) {
      if (window.localStorage.getItem(KEY_PREFIX + id)) used.add(id);
    }
  } catch {
    /* storage unavailable — every ticket simply stays live */
  }
  return used;
}

function writeUsed(id: string) {
  try {
    window.localStorage.setItem(KEY_PREFIX + id, String(Date.now()));
  } catch {
    /* same */
  }
}

/**
 * The promo shelf. Server-rendered in the creator's order, then — once the
 * browser knows which tickets this visitor has already used — re-sorted so
 * those drop to the end of the rail. The re-sort happens in an effect rather
 * than during render on purpose: the server has no idea what is in a
 * visitor's localStorage, and reading it during hydration would make the two
 * renders disagree.
 */
export function PromoList({
  promos,
  labels,
}: {
  promos: PublicPromo[];
  /** Localised on the server and passed down — see LapisPromos. */
  labels: { copy: string; copied: string; code: string; used: string };
}) {
  const [used, setUsed] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setUsed(readUsed(promos.map((p) => p.id)));
  }, [promos]);

  function onUse(promo: PublicPromo) {
    // Every tap is a click; only the first from this visitor is a "use". The
    // two are separate rows so staff can read both "how much interest" and
    // "how many people actually took it".
    track("promo_click", { promoId: promo.id, code: promo.code });
    if (used.has(promo.id)) return;
    track("promo_used", { promoId: promo.id, code: promo.code });
    writeUsed(promo.id);
    setUsed((prev) => new Set(prev).add(promo.id));
  }

  // Stable partition: live tickets keep the creator's order among themselves,
  // and so do the used ones behind them.
  const ordered = [
    ...promos.filter((p) => !used.has(p.id)),
    ...promos.filter((p) => used.has(p.id)),
  ];

  return (
    <div className="no-scrollbar flex snap-x snap-mandatory items-start gap-[14px] overflow-x-auto scroll-pl-[12px] px-[12px]">
      {ordered.map((p) => (
        <PromoCard
          key={p.id}
          promo={p}
          used={used.has(p.id)}
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
