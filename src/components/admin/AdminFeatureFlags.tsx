"use client";

import { useState, useTransition } from "react";
import { setFeatureFlag } from "@/lib/actions/admin";
import { FEATURES, FEATURE_LABELS, type Feature, type FeatureFlags } from "@/lib/features";
import { AError, ASpinner } from "./ui";

const DESCRIPTIONS: Record<Feature, string> = {
  entertainment: "Дуу, кино, номын таб бүхэлдээ.",
  wishlist: "Хүслийн жагсаалт.",
  not_for_me: "«Дахин авахгүй» хэсэг.",
  my_picks: "Цуглуулгууд.",
  ask: "Асуултын хайрцаг, нийтэлсэн хариултууд.",
};

/**
 * Panel B. Toggle = save: each switch writes feature_flag immediately, with no
 * separate save step. Optimistic locally, reverted if the write fails, so the
 * switch never shows a state the database doesn't hold.
 */
export function AdminFeatureFlags({
  profileId,
  initial,
}: {
  profileId: string;
  initial: FeatureFlags;
}) {
  const [flags, setFlags] = useState(initial);
  const [busy, setBusy] = useState<Feature | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  function toggle(feature: Feature) {
    const next = !flags[feature];
    setFlags((f) => ({ ...f, [feature]: next }));
    setBusy(feature);
    setError(null);
    start(async () => {
      try {
        await setFeatureFlag(profileId, feature, next);
      } catch (err) {
        setFlags((f) => ({ ...f, [feature]: !next }));
        setError(err instanceof Error ? err.message : "Хадгалж чадсангүй.");
      } finally {
        setBusy(null);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {error ? <AError>{error}</AError> : null}
      {FEATURES.map((f) => {
        const on = flags[f];
        return (
          <div
            key={f}
            className="flex items-center gap-3 rounded-[12px] border border-white/[0.07] bg-white/[0.02] px-3.5 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-inter text-[14px] font-semibold text-white">
                {FEATURE_LABELS[f]}
              </p>
              <p className="mt-0.5 font-inter text-[12px] text-white/35">
                {DESCRIPTIONS[f]}
              </p>
            </div>
            {busy === f ? <ASpinner className="h-4 w-4 shrink-0 text-[#fe7f42]" /> : null}
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={FEATURE_LABELS[f]}
              disabled={busy === f}
              onClick={() => toggle(f)}
              className={`relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors duration-150 disabled:opacity-60 ${
                on ? "bg-[#fe7f42]" : "bg-white/[0.14]"
              }`}
            >
              <span
                className={`absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white transition-transform duration-150 ${
                  on ? "translate-x-[23px]" : "translate-x-[3px]"
                }`}
              />
            </button>
          </div>
        );
      })}
      <p className="mt-1 font-inter text-[12px] leading-relaxed text-white/30">
        Унтраасан хэсэг нийтийн профайл болон бүтээгчийн дашбоардаас бүрмөсөн
        алга болно — саарлаад үлдэхгүй. Тохируулга шууд хадгалагдана.
      </p>
    </div>
  );
}
