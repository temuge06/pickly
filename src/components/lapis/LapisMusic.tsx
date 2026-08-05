"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import type { activityItem } from "@/db/schema";

type Item = typeof activityItem.$inferSelect;

/**
 * MMB section (Figma 731:14648) wired to real activity_items. The Дуу/Кино/Ном
 * tabs switch between the creator's synced tracks, films, and books. Each card
 * uses the exact "Music bar" style (orange #fe7f42, radius 14, 230×112) with
 * the item's real image/title/subtitle and a link to its externalUrl.
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
    { key: "track" as const, label: "дуу", items: tracks, cta: "сонсох" },
    { key: "film" as const, label: "Кино", items: films, cta: "үзэх" },
    { key: "book" as const, label: "Ном", items: books, cta: "үзэх" },
  ].filter((t) => t.items.length > 0);

  const [active, setActive] = useState(tabs[0]?.key ?? "track");
  if (tabs.length === 0) return null;
  const current = tabs.find((t) => t.key === active) ?? tabs[0]!;

  return (
    <div className="relative flex flex-col gap-[16px] bg-[#2a1617] py-[17px]">
      {/* Tabs */}
      <div className="mx-[26px] flex w-fit items-center gap-[8px] rounded-[19px] border border-[#fe7f42] bg-[#2a1617] p-[3px] drop-shadow-[0px_0px_1.65px_rgba(192,0,59,0.31)]">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`flex items-center justify-center rounded-[14px] px-[26px] py-[7px] text-[14px] font-bold capitalize transition-colors ${
              active === t.key
                ? "bg-[#fe7f42] text-[#feedd5]"
                : "text-[rgba(254,237,213,0.3)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Cards */}
      <div className="no-scrollbar flex gap-[7px] overflow-x-auto scroll-pl-[29px] px-[29px]">
        {current.items.map((it) => (
          <MusicBar key={it.id} item={it} cta={current.cta} />
        ))}
      </div>
    </div>
  );
}

const WAVE = [3, 7, 9, 7, 13, 7, 3, 13, 7, 3, 7, 9, 7, 3, 7, 9, 7, 13, 9, 7, 3];

function MusicBar({ item, cta }: { item: Item; cta: string }) {
  const note = (item.meta as { note?: string })?.note ?? null;
  return (
    <div className="flex h-[112px] w-[230px] shrink-0 snap-start items-center rounded-[14px] bg-[#fe7f42] py-[5px] pl-[5px] pr-[4px] drop-shadow-[0px_0px_2.85px_white]">
      <div className="h-[102px] w-[102px] shrink-0 overflow-hidden rounded-[10px] bg-black/10">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="relative h-[102px] w-[114px] shrink-0 pl-[5px]">
        <div className="flex flex-col gap-[9px] pt-[6px]">
          <div>
            <p className="line-clamp-1 text-[14px] font-bold leading-[16px] tracking-[-0.7px] text-[#feedd5]">
              {item.title}
            </p>
            {item.subtitle ? (
              <p className="line-clamp-1 text-[8px] font-extralight tracking-[-0.16px] text-[#fff0e6]">
                {item.subtitle}
              </p>
            ) : null}
          </div>
          {note ? (
            <p className="line-clamp-3 w-[104px] text-[10px] font-light leading-[11px] tracking-[-0.2px] text-[#feedd5]">
              “{note}”
            </p>
          ) : null}
        </div>
        <div className="absolute bottom-[13px] left-0 flex items-center gap-px">
          {WAVE.map((h, i) => (
            <span
              key={i}
              className="w-px rounded-[2px]"
              style={{
                height: `${h}px`,
                background: i < 8 ? "#feedd5" : "rgba(254,237,213,0.2)",
              }}
            />
          ))}
        </div>
        {item.externalUrl ? (
          <a
            href={item.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-[8px] right-[1px] flex h-[20px] items-center gap-1 rounded-[10px] bg-[#feedd5] px-[6px] text-[12px] font-semibold capitalize tracking-[-0.48px] text-[#fe7f42]"
          >
            {cta}
            <span className="text-[8px]">↗</span>
          </a>
        ) : null}
      </div>
    </div>
  );
}
