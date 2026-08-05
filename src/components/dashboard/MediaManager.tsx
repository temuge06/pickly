"use client";

import { useState, useTransition } from "react";
import { ProductImage } from "@/components/ui/ProductImage";
import {
  addMediaItem,
  deleteMediaItem,
  searchBooksAction,
  searchFilmsAction,
} from "@/lib/actions/media";
import type { MediaResult } from "@/lib/metadata/search";
import { DashSection, EmptyHint } from "./Section";
import { DashButton, DashInput } from "./ui";

type Item = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  provider: string;
};

/**
 * Shared manager for the two manual-media sections. `kind` picks the search
 * backend (TMDB films / Open Library books). Letterboxd sync is handled
 * separately in Listening/Watching connection UI — this covers manual adds.
 */
export function MediaManager({
  kind,
  label,
  icon,
  items,
  searchDisabledHint,
}: {
  kind: "film" | "book";
  label: string;
  icon?: string;
  items: Item[];
  searchDisabledHint?: string;
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
    <DashSection icon={icon} label={label}>
      <form onSubmit={onSearch} className="flex gap-2">
        <DashInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={kind === "film" ? "Кино хайх…" : "Ном хайх…"}
        />
        <DashButton type="submit" loading={searching} disabled={!query.trim()}>
          {searching ? "" : "Хайх"}
        </DashButton>
      </form>

      {/* Search results / loading skeletons */}
      {searching ? (
        <div className="no-scrollbar flex gap-3 overflow-x-hidden rounded-[16px] bg-black/[0.03] p-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[84px] shrink-0">
              <div className="skeleton aspect-[2/3] rounded-lg" />
              <div className="skeleton mt-1.5 h-2.5 w-4/5 rounded" />
            </div>
          ))}
        </div>
      ) : results && results.length > 0 ? (
        <div className="no-scrollbar animate-fade-up flex gap-3 overflow-x-auto rounded-[16px] bg-black/[0.03] p-3">
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
                className="w-[84px] shrink-0 text-left transition-transform active:scale-95 disabled:opacity-60"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-black/[0.06]">
                  {r.imageUrl ? (
                    <ProductImage src={r.imageUrl} alt="" sizes="84px" />
                  ) : null}
                  {busy ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-spotly-accent border-t-transparent" />
                    </div>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 font-header text-[11px] font-semibold text-spotly-ink">
                  {r.title}
                </p>
              </button>
            );
          })}
        </div>
      ) : results && results.length === 0 ? (
        <p className="px-1 font-header text-[12.5px] text-black/45">
          Илэрц олдсонгүй.
        </p>
      ) : searchDisabledHint ? (
        <p className="px-1 font-header text-[12.5px] text-black/40">
          {searchDisabledHint}
        </p>
      ) : null}

      {items.length === 0 ? (
        <EmptyHint>
          {kind === "film" ? "Үзсэн кинонуудаа нэмээрэй." : "Уншсан номоо нэмээрэй."}
        </EmptyHint>
      ) : null}

      {items.map((it) => (
        <div
          key={it.id}
          className="flex items-center gap-3 rounded-[14px] bg-black/[0.03] p-2.5 transition-colors"
        >
          <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-black/[0.06]">
            {it.imageUrl ? (
              <ProductImage src={it.imageUrl} alt="" sizes="40px" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-header text-[14px] font-bold text-spotly-ink">
              {it.title}
            </p>
            {it.subtitle ? (
              <p className="truncate font-header text-[11.5px] text-black/45">
                {it.subtitle}
              </p>
            ) : null}
          </div>
          {it.provider === "manual" ? (
            <button
              disabled={pending}
              onClick={() => start(async () => void (await deleteMediaItem(it.id)))}
              className="shrink-0 rounded-lg px-2 py-1 font-header text-[11px] font-bold text-[#c2334a] transition-colors active:bg-black/[0.05]"
            >
              Устгах
            </button>
          ) : (
            <span className="shrink-0 font-header text-[10px] font-semibold text-black/35">
              Letterboxd
            </span>
          )}
        </div>
      ))}
    </DashSection>
  );
}
