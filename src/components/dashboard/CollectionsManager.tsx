"use client";

import { useState, useTransition } from "react";
import { createCollection, deleteCollection } from "@/lib/actions/collections";
import { DashSection, EmptyHint } from "./Section";
import { DashButton, DashInput } from "./ui";

type Collection = { id: string; title: string; description: string | null };

export function CollectionsManager({
  collections,
}: {
  collections: Collection[];
}) {
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();

  return (
    <DashSection icon="🗂️" label="Цуглуулга">
      <div className="flex gap-2">
        <DashInput
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Жишээ: Өглөөний рутин"
        />
        <DashButton
          loading={pending}
          disabled={!title.trim()}
          onClick={() =>
            start(async () => {
              await createCollection(title);
              setTitle("");
            })
          }
        >
          {pending ? "" : "Нэмэх"}
        </DashButton>
      </div>

      {collections.length === 0 ? (
        <EmptyHint>Пикүүдээ бүлэглэх цуглуулга үүсгээрэй.</EmptyHint>
      ) : null}

      {collections.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between gap-2 rounded-[14px] bg-black/[0.03] px-4 py-3"
        >
          <span className="truncate font-header text-[14px] font-bold text-spotly-ink">
            {c.title}
          </span>
          <button
            disabled={pending}
            onClick={() => start(async () => void (await deleteCollection(c.id)))}
            className="shrink-0 rounded-lg px-2 py-1 font-header text-[11px] font-bold text-[#c2334a] transition-colors active:bg-black/[0.05]"
          >
            Устгах
          </button>
        </div>
      ))}
    </DashSection>
  );
}
