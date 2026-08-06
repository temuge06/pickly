"use client";

import { useState, useTransition } from "react";
import { createLink, deleteLink } from "@/lib/actions/links";
import { LButton, LInput, LSection, Empty } from "./ui";

type Link = { id: string; label: string; url: string };

export function LapisLinks({ links }: { links: Link[] }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [pending, start] = useTransition();

  return (
    <LSection icon="🔗" title="Links">
      <div className="flex flex-col gap-2 rounded-[16px] bg-white/[0.04] p-3">
        <LInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Нэр (жишээ: YouTube суваг)" />
        <LInput type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        <LButton
          loading={pending}
          disabled={!label.trim() || !url.trim()}
          onClick={() =>
            start(async () => {
              await createLink(label, url);
              setLabel("");
              setUrl("");
            })
          }
        >
          {pending ? "" : "Холбоос нэмэх"}
        </LButton>
      </div>

      {links.length === 0 ? <Empty>YouTube, TikTok, newsletter холбоосоо нэмээрэй.</Empty> : null}

      {links.map((l) => (
        <div key={l.id} className="flex items-center justify-between gap-2 rounded-[14px] bg-white/[0.04] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-malt text-[14px] font-bold text-[#feedd5]">{l.label}</p>
            <p className="truncate font-malt text-[11px] text-[#feedd5]/40">{l.url}</p>
          </div>
          <button
            disabled={pending}
            onClick={() => start(async () => void (await deleteLink(l.id)))}
            className="shrink-0 rounded-lg px-2 py-1 font-malt text-[11px] font-bold text-[#ff9a8a] transition-colors active:bg-white/[0.05]"
          >
            Устгах
          </button>
        </div>
      ))}
    </LSection>
  );
}
