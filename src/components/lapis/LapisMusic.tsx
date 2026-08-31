"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { activityItem } from "@/db/schema";
import { usePreviewAudio } from "@/lib/audio/preview";

type Item = typeof activityItem.$inferSelect;

/**
 * MMB section, rebuilt to the MVP design (Figma 1208:14758 / component
 * 685:5028). One segmented control over three shelves:
 *
 *   Дуу  — portrait "Music bar", 121×161: cover art with a CD peeking out
 *          behind it, a сонсох pill on the artwork, title + artist below
 *   Кино — poster card, 110×161
 *   Ном  — bookshelf: 68×100 covers on a wooden rail
 *
 * The music card is mounted on `--t-media` (white on both design variants)
 * rather than on the theme accent the old orange bar used: album art is
 * photographic and needs a neutral plate behind it, and a white card is what
 * separates this shelf from the product shelves further down the page.
 */
export function LapisMusic({
  tracks,
  films,
  books,
  labels,
}: {
  tracks: Item[];
  films: Item[];
  books: Item[];
  /** Localised on the server and passed in, so this client component never
   *  imports the string table and neither language ships twice. */
  labels?: {
    music: string;
    films: string;
    books: string;
    listen: string;
    stop: string;
  };
}) {
  const L = labels ?? {
    music: "Дуу",
    films: "Кино",
    books: "Ном",
    listen: "сонсох",
    stop: "зогсоох",
  };
  const tabs = [
    { key: "track" as const, label: L.music, items: tracks },
    { key: "film" as const, label: L.films, items: films },
    { key: "book" as const, label: L.books, items: books },
  ].filter((t) => t.items.length > 0);

  const [active, setActive] = useState(tabs[0]?.key ?? "track");
  if (tabs.length === 0) return null;
  const current = tabs.find((t) => t.key === active) ?? tabs[0]!;

  return (
    <div className="flex flex-col gap-[18px] border-b-[0.58px] border-[var(--t-border)] bg-[var(--t-bg)] py-[17px]">
      {/* Segmented control (Figma 685:5021). One rail 350px wide with the tabs
          spread across it, so the control keeps the same footprint whether a
          creator has one shelf or three — it used to shrink to fit and moved
          under the reader's thumb as tabs appeared. */}
      <div
        className="mx-auto flex w-[350px] max-w-[calc(100%-32px)] items-center rounded-[19px] bg-[var(--t-bg)] p-[3px]"
        style={{
          boxShadow: "0 0 0 0.5px color-mix(in srgb, var(--t-accent) 42%, transparent)",
        }}
        role="tablist"
      >
        {tabs.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(t.key)}
              className="flex flex-1 items-center justify-center rounded-[14px] px-[8px] py-[7px] text-[14px] font-bold capitalize leading-[13px] transition-colors"
              style={
                isActive
                  ? { background: "var(--t-accent)", color: "var(--t-on-accent)" }
                  : { color: "color-mix(in srgb, var(--t-accent) 40%, transparent)" }
              }
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Cards — per-tab layout */}
      {current.key === "track" ? (
        <div className="no-scrollbar flex gap-[7px] overflow-x-auto scroll-pl-[17px] px-[17px]">
          {current.items.map((it) => (
            <MusicBar key={it.id} item={it} listen={L.listen} stop={L.stop} />
          ))}
        </div>
      ) : current.key === "film" ? (
        <div className="no-scrollbar flex gap-[7px] overflow-x-auto scroll-pl-[17px] px-[17px] py-[2px]">
          {current.items.map((it) => (
            <MoviePoster key={it.id} item={it} />
          ))}
        </div>
      ) : (
        <Bookshelf books={current.items} />
      )}
    </div>
  );
}

// --- Дуу: music bar --------------------------------------------------------

function MusicBar({
  item,
  listen,
  stop,
}: {
  item: Item;
  listen: string;
  stop: string;
}) {
  const meta = item.meta as { note?: string; previewUrl?: string | null } | null;
  const note = meta?.note ?? null;
  const previewUrl = typeof meta?.previewUrl === "string" ? meta.previewUrl : null;
  const { playing, toggle } = usePreviewAudio();
  const isPlaying = previewUrl !== null && playing === previewUrl;

  // The сонсох control overlaps the cover art in the design, so it is
  // positioned rather than laid out. Both branches share everything but the
  // label and the handler.
  const pillClass =
    "absolute left-[30px] top-[98px] z-20 flex h-[20px] items-center justify-center gap-[4px] rounded-[10px] bg-black px-[8px] text-[13px] font-semibold capitalize leading-[13px] tracking-[-0.52px] text-white";

  return (
    <div
      className="relative h-[161px] w-[121px] shrink-0 snap-start overflow-hidden rounded-[14px]"
      style={{ background: "var(--t-media)", color: "var(--t-on-media)" }}
      title={note ?? undefined}
    >
      {/* The CD (Figma "image 17": 90×90 at 15,66). It sits BEHIND the cover
          and pokes out below it, which is what gives the card its depth — a
          disc tucked fully behind the artwork would be invisible. Drawn in CSS
          rather than shipped as an asset so it can spin while the preview
          plays, and so it stays light enough for the title to read over it. */}
      <span
        aria-hidden
        className={`absolute left-[15px] top-[66px] z-0 h-[90px] w-[90px] rounded-full ${
          isPlaying ? "animate-spin-disc" : ""
        }`}
        style={{
          background:
            "repeating-radial-gradient(circle at 50% 50%, rgba(0,0,0,0.10) 0 1.5px, rgba(0,0,0,0.04) 1.5px 3px)",
        }}
      >
        <span className="absolute left-1/2 top-1/2 h-[20px] w-[20px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--t-media)]" />
      </span>

      <div className="absolute left-[5px] top-[6px] z-10 h-[102px] w-[107px] overflow-hidden rounded-[10px] bg-black/10">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>

      {/* The 30s preview plays in place. Songs without one (older synced rows)
          keep the outbound link, so nothing that used to be tappable stopped
          being tappable. */}
      {previewUrl ? (
        <button
          onClick={() => toggle(previewUrl)}
          aria-label={`${item.title} ${isPlaying ? stop : listen}`}
          className={`${pillClass} transition-transform active:scale-[0.97]`}
        >
          {isPlaying ? stop : listen}
          {isPlaying ? (
            <svg width="7" height="7" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
              <rect x="1.5" y="1.5" width="9" height="9" rx="1.5" />
            </svg>
          ) : (
            <svg width="7" height="7" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
              <path d="M2.5 1.2 L10 6 L2.5 10.8 Z" />
            </svg>
          )}
        </button>
      ) : item.externalUrl ? (
        <a
          href={item.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={pillClass}
        >
          {listen}
          <span className="text-[9px] leading-none" aria-hidden>
            ↗
          </span>
        </a>
      ) : null}

      <div className="absolute left-[9px] top-[122px] z-10 w-[106px]">
        <p className="line-clamp-1 text-[14px] font-bold leading-[18px] tracking-[-0.7px]">
          {item.title}
        </p>
        {item.subtitle ? (
          <p
            className="line-clamp-1 text-[12px] font-light leading-[14px] tracking-[-0.24px]"
            style={{ color: "var(--t-on-media-muted)" }}
          >
            {item.subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}

// --- Кино: poster card (Figma 639:2316) ------------------------------------

function MoviePoster({ item }: { item: Item }) {
  const inner = (
    <>
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center p-2 text-center text-[12px] font-bold">
          {item.title}
        </span>
      )}
    </>
  );
  // Same `media` plate as the music card: both shelves sit in the one MMB
  // strip, and a poster on `card` was a different colour from the album art
  // beside it every time a theme gave `card` a gradient.
  const cls =
    "h-[161px] w-[110px] shrink-0 snap-start overflow-hidden rounded-[14px] bg-[var(--t-media)] text-[var(--t-on-media)] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)]";
  return item.externalUrl ? (
    <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

// --- Ном: bookshelf (Figma 731:14245) --------------------------------------

function Bookshelf({ books }: { books: Item[] }) {
  return (
    <div className="no-scrollbar overflow-x-auto scroll-pl-[17px] px-[17px]">
      <div className="flex h-[108px] items-end gap-[10px]">
        {books.map((b) => (
          <BookCover key={b.id} item={b} />
        ))}
      </div>
    </div>
  );
}

function BookCover({ item }: { item: Item }) {
  const author = item.subtitle ?? "";
  const cover = (
    <div className="relative mb-[8px] h-[100px] w-[68px] overflow-hidden rounded-[5px] shadow-[3px_3px_2px_0px_rgba(0,0,0,0.25)]">
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" />
      ) : (
        // Coverless → colored spine with title/author (Figma 731:14277)
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-[3px] p-[6px]"
          style={{
            backgroundImage:
              "linear-gradient(151.84deg, #b91c1c 8.49%, #7f1d1d 91.51%)",
          }}
        >
          <p className="text-center text-[8.5px] font-black leading-[10.6px] text-[#3a0512]">
            {item.title}
          </p>
          {author ? (
            <p className="text-center text-[7px] font-semibold leading-[10.5px] text-[#fca5a5]">
              {author}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );

  const shelf = (
    <span
      aria-hidden
      className="absolute bottom-0 left-[-5px] h-[8px] w-[78px]"
      style={{
        backgroundImage: "linear-gradient(to bottom, #c4956a, #a8784e)",
        boxShadow:
          "0px 3px 8px 0px rgba(0,0,0,0.22), inset 0px 1px 0px 0px rgba(255,255,255,0.14)",
      }}
    />
  );

  const cls =
    "relative flex h-[108px] w-[68px] shrink-0 snap-start flex-col items-center justify-end drop-shadow-[3px_3px_1px_rgba(0,0,0,0.25)]";
  return item.externalUrl ? (
    <a href={item.externalUrl} target="_blank" rel="noopener noreferrer" className={cls}>
      {shelf}
      {cover}
    </a>
  ) : (
    <div className={cls}>
      {shelf}
      {cover}
    </div>
  );
}
