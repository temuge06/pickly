"use client";

import { useState, useTransition } from "react";
import { createLink, deleteLink } from "@/lib/actions/links";
import { DashSection, EmptyHint } from "./Section";
import { DashButton, DashInput } from "./ui";

type Link = { id: string; label: string; url: string };

export function LinksManager({ links }: { links: Link[] }) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [pending, start] = useTransition();

  return (
    <DashSection icon="🔗" label="Links">
      <div className="flex flex-col gap-2 rounded-[16px] bg-black/[0.03] p-3">
        <DashInput
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Нэр (жишээ: YouTube суваг)"
        />
        <DashInput
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
        />
        <DashButton
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
        </DashButton>
      </div>

      {links.length === 0 ? (
        <EmptyHint>YouTube, TikTok, newsletter холбоосоо нэмээрэй.</EmptyHint>
      ) : null}

      {links.map((l) => (
        <div
          key={l.id}
          className="flex items-center justify-between gap-2 rounded-[14px] bg-black/[0.03] px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate font-header text-[14px] font-bold text-spotly-ink">
              {l.label}
            </p>
            <p className="truncate font-header text-[11px] text-black/40">{l.url}</p>
          </div>
          <button
            disabled={pending}
            onClick={() => start(async () => void (await deleteLink(l.id)))}
            className="shrink-0 rounded-lg px-2 py-1 font-header text-[11px] font-bold text-[#c2334a] transition-colors active:bg-black/[0.05]"
          >
            Устгах
          </button>
        </div>
      ))}
    </DashSection>
  );
}
