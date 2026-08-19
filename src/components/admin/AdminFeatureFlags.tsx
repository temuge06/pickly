"use client";

import { useState } from "react";
import { setFeatureFlag } from "@/lib/actions/admin";
import { FEATURES, FEATURE_LABELS, type Feature, type FeatureFlags } from "@/lib/features";
import { AError, ASpinner, SaveState } from "./ui";
import { useSaveState } from "./useSaveState";

const DESCRIPTIONS: Record<Feature, string> = {
  top_picks: "Цуглуулгад ороогүй үндсэн тавиур.",
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
  const save = useSaveState();

  function toggle(feature: Feature) {
    const next = !flags[feature];
    // Optimistic: the switch moves under the finger, then reverts if the write
    // fails. Waiting for the round trip made it feel unresponsive.
    setFlags((f) => ({ ...f, [feature]: next }));
    setBusy(feature);
    save.run(
      async () => {
        try {
          await setFeatureFlag(profileId, feature, next);
        } catch (e) {
          setFlags((f) => ({ ...f, [feature]: !next }));
          throw e;
        }
      },
      () => setBusy(null),
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="min-h-[18px]">
        <SaveState status={save.status} error={save.error} />
      </div>
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
              className={`relative h-[28px] w-[48px] shrink-0 cursor-pointer rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe7f42] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1115] disabled:cursor-default disabled:opacity-60 ${
                on ? "bg-[#fe7f42]" : "bg-white/[0.16]"
              }`}
            >
              {/* left-[3px] is load-bearing: a <button> centres its content, so
                  an absolutely-positioned knob with `left: auto` takes its
                  static origin from the track's MIDPOINT, not its left edge —
                  the translate then pushed it clean outside the track.
                  Anchoring left makes the travel (3px → 23px) deterministic. */}
              <span
                className={`absolute left-[3px] top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35)] transition-transform duration-150 ${
                  on ? "translate-x-[20px]" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        );
      })}
      {save.status === "error" ? <AError>{save.error}</AError> : null}
      <p className="mt-1 font-inter text-[12px] leading-relaxed text-white/30">
        Унтраасан хэсэг нийтийн профайл болон бүтээгчийн дашбоардаас бүрмөсөн
        алга болно — саарлаад үлдэхгүй. Тохируулга шууд хадгалагдана.
      </p>
    </div>
  );
}
