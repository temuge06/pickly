"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useTransition } from "react";
import {
  addMediaItem,
  deleteMediaItem,
  searchBooksAction,
  searchFilmsAction,
} from "@/lib/actions/media";
import type { MediaResult } from "@/lib/metadata/search";
import { LButton, LInput, LSection, Empty } from "./ui";

type Item = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  provider: string;
};

export function LapisMedia({
  kind,
  icon,
  title,
  items,
  disabledHint,
}: {
  kind: "film" | "book";
  icon: string;
  title: string;
  items: Item[];
  disabledHint?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MediaResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || searching) return;
    setSearching(true);
    setResults(null);
    const fn = kind === "film" ? searchFilmsAction : searchBooksAction;
    setResults(await fn(query));
    setSearching(false);
  }

  return (
    <LSection icon={icon} title={title}>
      <form onSubmit={onSearch} className="flex gap-2">
        <LInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={kind === "film" ? "Кино хайх…" : "Ном хайх…"}
        />
        <LButton type="submit" loading={searching} disabled={!query.trim()}>
          {searching ? "" : "Хайх"}
        </LButton>
      </form>

      {searching ? (
        <div className="flex gap-3 overflow-x-hidden rounded-[14px] bg-[var(--t-well)] p-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[74px] shrink-0">
              <div className="skeleton-theme aspect-[2/3] rounded-lg" />
              <div className="skeleton-theme mt-1.5 h-2.5 w-4/5 rounded" />
            </div>
          ))}
        </div>
      ) : results && results.length > 0 ? (
        <div className="no-scrollbar animate-fade-up flex gap-3 overflow-x-auto rounded-[14px] bg-[var(--t-well)] p-3">
          {results.map((r) => {
            const busy = addingId === r.externalId;
            return (
              <button
                key={r.externalId}
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    setAddingId(r.externalId);
                    await addMediaItem({
                      kind,
                      title: r.title,
                      subtitle: r.subtitle,
                      imageUrl: r.imageUrl,
                      externalUrl: r.externalUrl,
                      externalId: r.externalId,
                    });
                    setResults(null);
                    setQuery("");
                    setAddingId(null);
                  })
                }
                className="w-[74px] shrink-0 text-left transition-transform active:scale-95 disabled:opacity-60"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-[var(--t-field)]">
                  {r.imageUrl ? <img src={r.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
                  {busy ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--t-accent)] border-t-transparent" />
                    </div>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 font-malt text-[11px] font-semibold text-[var(--t-text)]">{r.title}</p>
              </button>
            );
          })}
        </div>
      ) : results && results.length === 0 ? (
        <p className="px-1 font-malt text-[12.5px] text-[var(--t-muted)]">Илэрц олдсонгүй.</p>
      ) : disabledHint ? (
        <p className="px-1 font-malt text-[12.5px] text-[var(--t-muted)]">{disabledHint}</p>
      ) : null}

      {items.length === 0 ? (
        <Empty>{kind === "film" ? "Үзсэн кинонуудаа нэмээрэй." : "Уншсан номоо нэмээрэй."}</Empty>
      ) : null}

      {items.map((it) => (
        <div key={it.id} className="flex items-center gap-3 rounded-[14px] bg-[var(--t-well)] p-2.5">
          <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-[var(--t-field)]">
            {it.imageUrl ? <img src={it.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-malt text-[14px] font-bold text-[var(--t-text)]">{it.title}</p>
            {it.subtitle ? <p className="truncate font-malt text-[11.5px] text-[var(--t-muted)]">{it.subtitle}</p> : null}
          </div>
          {it.provider === "manual" ? (
            <button
              disabled={pending}
              onClick={() => start(async () => void (await deleteMediaItem(it.id)))}
              className="shrink-0 rounded-lg px-2 py-1 font-malt text-[11px] font-bold text-[var(--t-danger)] transition-colors active:bg-[var(--t-field)]"
            >
              Устгах
            </button>
          ) : (
            <span className="shrink-0 font-malt text-[10px] font-semibold text-[var(--t-muted)]">Синк</span>
          )}
        </div>
      ))}
    </LSection>
  );
}
