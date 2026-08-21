"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState, useTransition } from "react";
import { addMediaItem, deleteMediaItem } from "@/lib/actions/media";
import { usePreviewAudio } from "@/lib/audio/preview";
import type { MusicResult } from "@/lib/metadata/search";
import { LButton, LInput, LSection, Empty } from "./ui";

type Item = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  provider: string;
  meta: Record<string, unknown> | null;
};

const DEBOUNCE_MS = 350;

/**
 * Дуу хөгжим — the same shape as LapisMedia (search, pick a result, it lands in
 * the list below), against iTunes Search instead of TMDB.
 *
 * Films and books search on submit; songs search as you type, because a song
 * title is short enough that a round-trip per pause is cheap and the artwork
 * grid is what people actually recognise a track by. Each keystroke aborts the
 * request before it, so results can't arrive out of order.
 */
export function LapisSongs({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MusicResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const { playing, toggle } = usePreviewAudio();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      abortRef.current?.abort();
      setResults(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const json = (await res.json()) as { results?: MusicResult[] };
        setResults(json.results ?? []);
        setSearching(false);
      } catch {
        // An abort is the next keystroke taking over — leave the spinner up
        // for the request that replaced this one.
        if (!controller.signal.aborted) {
          setResults([]);
          setSearching(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <LSection icon="🎵" title="Дуу хөгжим">
      <LInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Дуу хайх…"
        aria-label="Дуу хайх"
      />

      {searching ? (
        <div className="flex gap-3 overflow-x-hidden rounded-[14px] bg-[var(--t-well)] p-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-[84px] shrink-0">
              <div className="skeleton-theme aspect-square rounded-lg" />
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
                      kind: "track",
                      title: r.title,
                      subtitle: r.subtitle,
                      imageUrl: r.imageUrl,
                      externalUrl: r.externalUrl,
                      externalId: r.externalId,
                      meta: {
                        itunesTrackId: r.itunesTrackId,
                        previewUrl: r.previewUrl,
                        album: r.album,
                      },
                    });
                    setResults(null);
                    setQuery("");
                    setAddingId(null);
                  })
                }
                className="w-[84px] shrink-0 text-left transition-transform active:scale-95 disabled:opacity-60"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-[var(--t-field)]">
                  {r.imageUrl ? <img src={r.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
                  {busy ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--t-accent)] border-t-transparent" />
                    </div>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 font-malt text-[11px] font-semibold text-[var(--t-text)]">{r.title}</p>
                {r.subtitle ? (
                  <p className="line-clamp-1 font-malt text-[10px] text-[var(--t-muted)]">{r.subtitle}</p>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : results && results.length === 0 ? (
        <p className="px-1 font-malt text-[12.5px] text-[var(--t-muted)]">Илэрц олдсонгүй.</p>
      ) : null}

      {items.length === 0 ? <Empty>Сонсдог дуугаа нэмээрэй.</Empty> : null}

      {items.map((it) => {
        const previewUrl =
          typeof it.meta?.previewUrl === "string" ? it.meta.previewUrl : null;
        const isPlaying = previewUrl !== null && playing === previewUrl;
        return (
          <div key={it.id} className="flex items-center gap-3 rounded-[14px] bg-[var(--t-well)] p-2.5">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[var(--t-field)]">
              {it.imageUrl ? <img src={it.imageUrl} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-malt text-[14px] font-bold text-[var(--t-text)]">{it.title}</p>
              {it.subtitle ? <p className="truncate font-malt text-[11.5px] text-[var(--t-muted)]">{it.subtitle}</p> : null}
            </div>
            {previewUrl ? (
              <button
                onClick={() => toggle(previewUrl)}
                aria-label={isPlaying ? `${it.title} зогсоох` : `${it.title} сонсох`}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90"
                style={{ background: "color-mix(in srgb, var(--t-accent) 15%, transparent)", color: "var(--t-accent)" }}
              >
                {isPlaying ? <StopGlyph /> : <PlayGlyph />}
              </button>
            ) : null}
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
        );
      })}
    </LSection>
  );
}

function PlayGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <path d="M2.5 1.2 L10 6 L2.5 10.8 Z" />
    </svg>
  );
}

function StopGlyph() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" />
    </svg>
  );
}
