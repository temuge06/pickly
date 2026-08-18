"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { searchCreators, type CreatorResult } from "@/lib/actions/admin";
import { AInput, ASpinner } from "./ui";

/**
 * Type-to-search over handle + display name. The initial list is server-
 * rendered so the page is useful before a keystroke; typing debounces into the
 * staff-only searchCreators action.
 */
export function CreatorSearch({ initial }: { initial: CreatorResult[] }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(initial);
  const [pending, start] = useTransition();

  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(() => {
      start(async () => {
        try {
          setResults(await searchCreators(q));
        } catch {
          setResults([]);
        }
      });
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <AInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Handle эсвэл нэрээр хайх…"
          aria-label="Бүтээгч хайх"
          autoFocus
        />
        {pending ? (
          <ASpinner className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#fe7f42]" />
        ) : null}
      </div>

      {results.length === 0 ? (
        <p className="rounded-[12px] border border-white/[0.07] bg-white/[0.02] px-4 py-6 text-center font-inter text-[13.5px] text-white/35">
          {query.trim() ? "Илэрц алга." : "Бүтээгч алга."}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {results.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/${c.id}`}
                className="flex items-center gap-3 rounded-[12px] border border-white/[0.07] bg-white/[0.02] px-3.5 py-3 transition-colors hover:border-[#fe7f42]/40 hover:bg-white/[0.05]"
              >
                {c.avatarUrl ? (
                  <img
                    src={c.avatarUrl}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fe7f42]/15 font-inter text-[15px] font-semibold text-[#fe7f42]">
                    {c.displayName.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-inter text-[14.5px] font-semibold text-white">
                    {c.displayName}
                  </span>
                  <span className="block truncate font-inter text-[12.5px] text-white/40">
                    @{c.handle}
                  </span>
                </span>
                <span className="shrink-0 font-malt text-[12px] font-bold text-[#fe7f42]">
                  Нээх →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
