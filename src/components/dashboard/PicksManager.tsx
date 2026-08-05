"use client";

import { useState, useTransition } from "react";
import { ProductImage } from "@/components/ui/ProductImage";
import { formatMnt } from "@/lib/format";
import { deletePick, updatePickStatus } from "@/lib/actions/picks";
import { DashSection, EmptyHint } from "./Section";
import { AddPick } from "./AddPick";
import { Spinner } from "./ui";

type Pick = {
  id: string;
  title: string;
  brand: string | null;
  imageUrl: string | null;
  priceMnt: number | null;
  note: string | null;
  status: string;
  collectionId: string | null;
};
type Collection = { id: string; title: string };

const STATUS_LABELS: Record<string, string> = {
  testing: "Одоо туршиж байна",
  recommend: "Баттай санал болгоно",
  repurchased: "Дахин авсан",
  wont_rebuy: "Дахин авахгүй",
};

export function PicksManager({
  picks,
  collections,
}: {
  picks: Pick[];
  collections: Collection[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <DashSection
      icon="💛"
      label="Picks"
      action={
        <button
          onClick={() => setAdding((v) => !v)}
          className="rounded-full bg-spotly-accent/10 px-3 py-1.5 font-header text-[12px] font-bold text-[#c23361] transition-colors active:bg-spotly-accent/20"
        >
          {adding ? "Хаах" : "+ Нэмэх"}
        </button>
      }
    >
      {adding ? (
        <AddPick collections={collections} onDone={() => setAdding(false)} />
      ) : null}

      {picks.length === 0 && !adding ? (
        <EmptyHint>Эхний пикээ нэмээрэй. Барааны холбоос тавихад л болно.</EmptyHint>
      ) : null}

      {picks.map((p) => (
        <PickRow key={p.id} pick={p} />
      ))}
    </DashSection>
  );
}

function PickRow({ pick }: { pick: Pick }) {
  const [pending, start] = useTransition();

  return (
    <div
      className={`flex gap-3 rounded-[16px] bg-black/[0.03] p-3 transition-opacity ${
        pending ? "opacity-60" : ""
      }`}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[12px] bg-black/[0.06]">
        {pick.imageUrl ? <ProductImage src={pick.imageUrl} alt="" sizes="64px" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        {pick.brand ? (
          <p className="truncate font-header text-[10px] font-bold uppercase tracking-wide text-black/40">
            {pick.brand}
          </p>
        ) : null}
        <p className="truncate font-header text-[14.5px] font-bold text-spotly-ink">
          {pick.title}
        </p>
        {pick.priceMnt != null ? (
          <p className="font-header text-[12px] font-semibold text-black/55">
            {formatMnt(pick.priceMnt)}
          </p>
        ) : null}
        <div className="mt-1.5 flex items-center gap-2">
          <div className="relative">
            <select
              value={pick.status}
              disabled={pending}
              onChange={(e) =>
                start(async () => void (await updatePickStatus(pick.id, e.target.value)))
              }
              className="min-h-[34px] appearance-none rounded-[10px] bg-black/[0.05] px-2.5 py-1 pr-6 font-header text-[11px] font-bold text-spotly-ink outline-none ring-1 ring-inset ring-black/[0.06] focus:ring-2 focus:ring-spotly-accent"
            >
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-black/40">
              ▼
            </span>
          </div>
          {pending ? <Spinner className="h-3.5 w-3.5 text-black/30" /> : null}
          <button
            disabled={pending}
            onClick={() => start(async () => void (await deletePick(pick.id)))}
            className="ml-auto min-h-[34px] rounded-lg px-2 font-header text-[11px] font-bold text-[#c2334a] transition-colors active:bg-black/[0.05]"
          >
            Устгах
          </button>
        </div>
      </div>
    </div>
  );
}
