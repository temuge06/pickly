"use client";

import { useState, useTransition } from "react";
import { createCollection, deleteCollection } from "@/lib/actions/collections";
import { MAX_COLLECTIONS } from "@/lib/validation";
import { LButton, LInput, LSection, Empty, Hint } from "./ui";

type Collection = { id: string; title: string };

/**
 * Create/remove collections (max 3). Picks are assigned to a collection from
 * each pick row (see LapisPicks) — a pick in a collection shows under "My
 * Picks" as a box on the public profile.
 */
export function LapisCollections({ collections }: { collections: Collection[] }) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const atMax = collections.length >= MAX_COLLECTIONS;

  return (
    <LSection icon="🗂️" title="Цуглуулга">
      <p className="-mt-1 px-0.5 font-malt text-[12.5px] text-[#feedd5]/45">
        Пикүүдээ бүлэглэх бүлгүүд. Хамгийн ихдээ {MAX_COLLECTIONS} цуглуулга.
      </p>

      {atMax ? (
        <Hint>3 цуглуулга үүсгэсэн байна. Шинээр нэмэхийн тулд аль нэгийг устгана уу.</Hint>
      ) : (
        <div className="flex gap-2">
          <LInput
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError("");
            }}
            placeholder="Жишээ: Ажлын ширээ"
          />
          <LButton
            loading={pending}
            disabled={!title.trim()}
            onClick={() =>
              start(async () => {
                try {
                  await createCollection(title);
                  setTitle("");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
                }
              })
            }
          >
            {pending ? "" : "Нэмэх"}
          </LButton>
        </div>
      )}

      {error ? (
        <Hint>
          <span className="text-[#ff9a8a]">{error}</span>
        </Hint>
      ) : null}

      {collections.length === 0 ? <Empty>Одоогоор цуглуулга алга.</Empty> : null}

      {collections.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-2 rounded-[14px] bg-white/[0.04] px-4 py-3">
          <span className="truncate font-malt text-[14px] font-bold text-[#feedd5]">{c.title}</span>
          <button
            disabled={pending}
            onClick={() => start(async () => void (await deleteCollection(c.id)))}
            className="shrink-0 rounded-lg px-2 py-1 font-malt text-[11px] font-bold text-[#ff9a8a] transition-colors active:bg-white/[0.05]"
          >
            Устгах
          </button>
        </div>
      ))}
    </LSection>
  );
}
