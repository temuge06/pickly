"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteCampaign,
  setCampaignActive,
  type CampaignRow,
} from "@/lib/actions/campaigns";
import { AButton, AError } from "./ui";
import { CampaignForm } from "./CampaignForm";

/** Campaign library: every campaign, active or not, with its live placement count. */
export function CampaignLibrary({ campaigns }: { campaigns: CampaignRow[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-inter text-[13px] text-white/40">
          {campaigns.length} кампанит ажил
        </p>
        <AButton onClick={() => setCreating((v) => !v)}>
          {creating ? "Хаах" : "+ Шинэ кампанит ажил"}
        </AButton>
      </div>

      {creating ? (
        <div className="rounded-[14px] border border-white/[0.08] bg-white/[0.02] p-4">
          <CampaignForm onSaved={() => setCreating(false)} />
        </div>
      ) : null}

      {error ? <AError>{error}</AError> : null}

      {campaigns.length === 0 ? (
        <p className="rounded-[12px] border border-white/[0.07] bg-white/[0.02] px-4 py-6 text-center font-inter text-[13.5px] text-white/35">
          Кампанит ажил алга.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {campaigns.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-3 rounded-[12px] border border-white/[0.07] bg-white/[0.02] p-3"
            >
              <div className="h-[52px] w-[65px] shrink-0 overflow-hidden rounded-[8px] bg-white/[0.05]">
                {c.bannerImageUrl ? (
                  <img src={c.bannerImageUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-inter text-[14px] font-semibold text-white">
                  {c.title}
                </p>
                <p className="truncate font-inter text-[12px] text-white/40">
                  {c.assignedCount} профайл дээр
                  {c.isActive ? "" : " · унтраалттай"}
                </p>
                {!c.bannerImageUrl ? (
                  <p className="truncate font-inter text-[12px] font-semibold text-[#ffb3a3]">
                    Баннер зураг алга — профайл дээр харагдахгүй
                  </p>
                ) : null}
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 font-malt text-[10.5px] font-black uppercase ${
                  c.isActive
                    ? "bg-[#7ddb9a]/15 text-[#9ee7b4]"
                    : "bg-white/[0.08] text-white/40"
                }`}
              >
                {c.isActive ? "Идэвхтэй" : "Зогссон"}
              </span>
              <Link
                href={`/admin/campaigns/${c.id}`}
                className="shrink-0 rounded-[8px] px-2 py-1 font-malt text-[12px] font-bold text-[#fe7f42]"
              >
                Нээх →
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => setCampaignActive(c.id, !c.isActive))}
                className="shrink-0 rounded-[8px] px-2 py-1 font-malt text-[12px] font-bold text-white/45 transition-colors hover:text-white/80 disabled:opacity-40"
              >
                {c.isActive ? "Зогсоох" : "Асаах"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (confirm(`«${c.title}» устгах уу? Бүх профайлаас алга болно.`)) {
                    run(() => deleteCampaign(c.id));
                  }
                }}
                className="shrink-0 rounded-[8px] px-2 py-1 font-malt text-[12px] font-bold text-[#ffb3a3] transition-colors hover:text-[#ff8a75] disabled:opacity-40"
              >
                Устгах
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
