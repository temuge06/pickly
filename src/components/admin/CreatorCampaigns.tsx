"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  assignCampaign,
  reorderProfileCampaigns,
  unassignCampaign,
  type CampaignRow,
} from "@/lib/actions/campaigns";
import { AButton, AError, ASpinner } from "./ui";

type Assigned = {
  assignmentId: string;
  campaignId: string;
  title: string;
  bannerImageUrl: string | null;
  isActive: boolean;
};

/**
 * Creator → campaigns: "what is running on this page right now", the mirror of
 * the campaign detail view's "where is this banner running". Same data, other
 * direction — admins think both ways depending on the task.
 */
export function CreatorCampaigns({
  profileId,
  assigned,
  library,
}: {
  profileId: string;
  assigned: Assigned[];
  library: CampaignRow[];
}) {
  const router = useRouter();
  const [pick, setPick] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const assignedIds = new Set(assigned.map((a) => a.campaignId));
  const available = library.filter((c) => !assignedIds.has(c.id));

  function run(fn: () => Promise<void>) {
    setError(null);
    start(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
      }
    });
  }

  function move(index: number, delta: number) {
    const next = [...assigned];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    run(() =>
      reorderProfileCampaigns(
        profileId,
        next.map((a) => a.assignmentId),
      ),
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {assigned.length === 0 ? (
        <p className="font-inter text-[12.5px] text-white/30">
          Энэ профайл дээр баннер алга — Top Picks хэсэг харагдахгүй.
        </p>
      ) : (
        assigned.map((a, i) => (
          <div
            key={a.assignmentId}
            className="flex items-center gap-2.5 rounded-[12px] border border-white/[0.07] bg-white/[0.02] p-2.5"
          >
            <span className="font-malt text-[11px] font-bold text-white/30">{i + 1}</span>
            <div className="h-[40px] w-[50px] shrink-0 overflow-hidden rounded-[7px] bg-white/[0.05]">
              {a.bannerImageUrl ? (
                <img src={a.bannerImageUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <Link
              href={`/admin/campaigns/${a.campaignId}`}
              className="min-w-0 flex-1 truncate font-inter text-[13.5px] text-white/85 hover:text-white"
            >
              {a.title}
              {a.isActive ? "" : " · зогссон"}
            </Link>
            <button
              type="button"
              disabled={pending || i === 0}
              onClick={() => move(i, -1)}
              aria-label="Дээш"
              className="shrink-0 rounded-[7px] px-2 py-1 font-malt text-[13px] text-white/45 hover:text-white/85 disabled:opacity-25"
            >
              ↑
            </button>
            <button
              type="button"
              disabled={pending || i === assigned.length - 1}
              onClick={() => move(i, 1)}
              aria-label="Доош"
              className="shrink-0 rounded-[7px] px-2 py-1 font-malt text-[13px] text-white/45 hover:text-white/85 disabled:opacity-25"
            >
              ↓
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => unassignCampaign(a.campaignId, profileId))}
              className="shrink-0 rounded-[8px] px-2 py-1 font-malt text-[12px] font-bold text-[#ffb3a3] hover:text-[#ff8a75] disabled:opacity-40"
            >
              Хасах
            </button>
          </div>
        ))
      )}

      {available.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          <p className="mt-1 font-malt text-[11.5px] font-bold uppercase tracking-wide text-white/40">
            Баннер нэмэх
          </p>
          {/* A banner is chosen by looking at it, not by reading a title in a
              dropdown — the creative IS the thing being picked. */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {available.map((c) => {
              const chosen = pick === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setPick(chosen ? "" : c.id)}
                  aria-pressed={chosen}
                  className={`overflow-hidden rounded-[10px] border text-left transition-colors ${
                    chosen
                      ? "border-[#fe7f42] ring-1 ring-[#fe7f42]"
                      : "border-white/[0.08] hover:border-white/25"
                  }`}
                >
                  <span className="block aspect-[382/305] w-full bg-white/[0.05]">
                    {c.bannerImageUrl ? (
                      <img
                        src={c.bannerImageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="block truncate px-2 py-1.5 font-inter text-[11.5px] text-white/75">
                    {c.title}
                    {c.isActive ? "" : " · зогссон"}
                  </span>
                </button>
              );
            })}
          </div>
          <AButton
            disabled={!pick || pending}
            onClick={() =>
              run(async () => {
                await assignCampaign(pick, [profileId]);
                setPick("");
              })
            }
          >
            {pick ? "Сонгосон баннерыг нэмэх" : "Баннер сонгоно уу"}
          </AButton>
        </div>
      ) : (
        <p className="font-inter text-[12px] text-white/30">
          Нэмэх боломжтой өөр баннер алга.{" "}
          <Link href="/admin/campaigns" className="text-[#fe7f42] underline">
            Шинээр үүсгэх
          </Link>
        </p>
      )}

      {pending ? <ASpinner className="h-4 w-4 text-[#fe7f42]" /> : null}
      {error ? <AError>{error}</AError> : null}
    </div>
  );
}
