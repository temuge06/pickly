"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { activityItem } from "@/db/schema";

type Item = typeof activityItem.$inferSelect;

/**
 * MMB section (Figma 731:14227, all 3 variants) wired to real activity_items.
 * The Дуу / Кино / Ном tabs each have their own card design:
 *   Дуу  — "Music bar" (orange #fe7f42, 230×112) with album art + сонсох
 *   Кино — poster card (cream #feedd5, 110×161, radius 19)
 *   Ном  — wooden bookshelf: 68×100 covers on a #c4956a→#a8784e shelf,
 *          colored-spine fallback for coverless books
 */
export function LapisMusic({
  tracks,
  films,
  books,
}: {
  tracks: Item[];
  films: Item[];
  books: Item[];
}) {
  const tabs = [
    { key: "track" as const, label: "дуу", items: tracks },
    { key: "film" as const, label: "Кино", items: films },
    { key: "book" as const, label: "Ном", items: books },
  ].filter((t) => t.items.length > 0);

  const [active, setActive] = useState(tabs[0]?.key ?? "track");
  if (tabs.length === 0) return null;
  const current = tabs.find((t) => t.key === active) ?? tabs[0]!;

  return (
    <div className="flex flex-col gap-[16px] bg-[var(--t-bg)] py-[17px]">
      {/* Tabs (Figma 731:14235) */}
      {/* mx-auto, not mx-[26px]: the pill is only as wide as its tabs, so a
          fixed left margin parked it off-centre by however much the row was
          narrower than the frame. */}
      <div className="mx-auto flex w-fit items-center gap-[16px] rounded-[19px] border border-[var(--t-accent)] bg-[var(--t-bg)] p-[3px] drop-shadow-[0px_0px_1.65px_rgba(192,0,59,0.31)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`flex items-center justify-center rounded-[14px] px-[30px] py-[7px] text-[14px] font-bold capitalize leading-[13px] transition-colors ${
              active === t.key
                ? "bg-[var(--t-accent)] text-[var(--t-on-accent)]"
                : "text-[var(--t-muted)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards — per-tab layout */}
      {current.key === "track" ? (
        <div className="no-scrollbar flex gap-[7px] overflow-x-auto scroll-pl-[29px] px-[29px]">
          {current.items.map((it) => (
            <MusicBar key={it.id} item={it} />
          ))}
        </div>
      ) : current.key === "film" ? (
        <div className="no-scrollbar flex gap-[7px] overflow-x-auto scroll-pl-[29px] px-[29px] py-[2px]">
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

function MusicBar({ item }: { item: Item }) {
  const note = (item.meta as { note?: string })?.note ?? null;
  return (
    <div className="flex h-[112px] w-[230px] shrink-0 snap-start items-center rounded-[14px] bg-[var(--t-accent)] py-[5px] pl-[5px] pr-[4px] drop-shadow-[0px_0px_2.85px_white]">
      <div className="h-[102px] w-[102px] shrink-0 overflow-hidden rounded-[10px] bg-black/10">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="relative h-[102px] w-[114px] shrink-0 pl-[5px]">
        <div className="flex flex-col gap-[9px] pt-[6px]">
          <div>
            <p className="line-clamp-1 text-[14px] font-bold leading-[16px] tracking-[-0.7px] text-[var(--t-on-accent)]">
              {item.title}
            </p>
            {item.subtitle ? (
              <p className="line-clamp-1 text-[8px] font-extralight tracking-[-0.16px] text-[var(--t-on-accent)]/70">
                {item.subtitle}
              </p>
            ) : null}
          </div>
          {note ? (
            <p className="line-clamp-3 w-[104px] text-[10px] font-light leading-[11px] tracking-[-0.2px] text-[var(--t-on-accent)]">
              “{note}”
            </p>
          ) : null}
        </div>
        {/* The decorative waveform used to sit to the left of this button and
            was read as a play control it never was. Removing it frees the row,
            so сонсох — the one thing here that IS tappable — gets the full
            width and a real tap target. */}
        {item.externalUrl ? (
          <a
            href={item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-[6px] left-[5px] right-[1px] flex h-[28px] items-center justify-center gap-[3px] rounded-[14px] bg-[var(--t-on-accent)] text-[14px] font-bold capitalize tracking-[-0.28px] text-[var(--t-accent)]"
          >
            сонсох<span className="text-[10px]">↗</span>
          </a>
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
        <span className="flex h-full w-full items-center justify-center p-2 text-center font-malt text-[12px] font-bold uppercase text-[#b22c20]">
          {item.title}
        </span>
      )}
    </>
  );
  const cls =
    "h-[161px] w-[110px] shrink-0 snap-start overflow-hidden rounded-[19px] bg-[var(--t-card)] text-[var(--t-on-card)] shadow-[0px_0px_4px_0px_rgba(0,0,0,0.25)]";
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
    <div className="no-scrollbar overflow-x-auto scroll-pl-[20px] px-[20px]">
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
          <p className="text-center font-header text-[8.5px] font-black leading-[10.6px] text-[#3a0512]">
            {item.title}
          </p>
          {author ? (
            <p className="text-center font-header text-[7px] font-semibold leading-[10.5px] text-[#fca5a5]">
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
