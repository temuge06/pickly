"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { searchCreators, type CreatorResult } from "@/lib/actions/admin";
import {
  assignCampaign,
  unassignCampaign,
  type AssignedCreator,
} from "@/lib/actions/campaigns";
import { AButton, AError, AInput, ASpinner } from "./ui";

/**
 * Campaign → creators. Bulk by default: the common case is one banner running
 * across many pages, so the picker accumulates a selection and assigns in one
 * action rather than one round-trip per creator.
 */
export function CampaignAssign({
  campaignId,
  assigned,
}: {
  campaignId: string;
  assigned: AssignedCreator[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CreatorResult[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [searching, startSearch] = useTransition();
  const [saving, startSave] = useTransition();

  const assignedIds = new Set(assigned.map((a) => a.profileId));
  const selectedIds = Object.keys(selected);

  useEffect(() => {
    const t = setTimeout(() => {
      startSearch(async () => {
        try {
          setResults(await searchCreators(query.trim()));
        } catch {
          setResults([]);
        }
      });
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  function toggle(c: CreatorResult) {
    setSelected((s) => {
      const next = { ...s };
      if (next[c.id]) delete next[c.id];
      else next[c.id] = c.handle;
      return next;
    });
  }

  function run(fn: () => Promise<void>) {
    setError(null);
    startSave(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 font-malt text-[11.5px] font-bold uppercase tracking-wide text-white/40">
          Одоо ажиллаж буй ({assigned.length})
        </p>
        {assigned.length === 0 ? (
          <p className="font-inter text-[12.5px] text-white/30">
            Ямар ч профайл дээр ороогүй байна.
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {assigned.map((a) => (
              <li
                key={a.assignmentId}
                className="flex items-center gap-2.5 rounded-[10px] border border-white/[0.07] bg-white/[0.02] px-3 py-2"
              >
                {a.avatarUrl ? (
                  <img src={a.avatarUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fe7f42]/15 font-inter text-[12px] font-semibold text-[#fe7f42]">
                    {a.displayName.trim().charAt(0).toUpperCase() || "?"}
                  </span>
                )}
                <Link
                  href={`/admin/${a.profileId}`}
                  className="min-w-0 flex-1 truncate font-inter text-[13.5px] text-white/85 hover:text-white"
                >
                  @{a.handle}
                </Link>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => run(() => unassignCampaign(campaignId, a.profileId))}
                  className="shrink-0 rounded-[8px] px-2 py-1 font-malt text-[12px] font-bold text-[#ffb3a3] transition-colors hover:text-[#ff8a75] disabled:opacity-40"
                >
                  Хасах
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-2 font-malt text-[11.5px] font-bold uppercase tracking-wide text-white/40">
          Профайл нэмэх
        </p>
        <div className="relative">
          <AInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Handle эсвэл нэрээр хайх…"
            aria-label="Бүтээгч хайх"
          />
          {searching ? (
            <ASpinner className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#fe7f42]" />
          ) : null}
        </div>

        <ul className="mt-2 flex max-h-[280px] flex-col gap-1 overflow-y-auto">
          {results.map((c) => {
            const already = assignedIds.has(c.id);
            const picked = !!selected[c.id];
            return (
              <li key={c.id}>
                <button
                  type="button"
                  disabled={already}
                  onClick={() => toggle(c)}
                  className={`flex w-full items-center gap-2.5 rounded-[10px] border px-3 py-2 text-left transition-colors disabled:opacity-40 ${
                    picked
                      ? "border-[#fe7f42] bg-[#fe7f42]/10"
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border text-[10px] ${
                      picked ? "border-[#fe7f42] bg-[#fe7f42] text-[#241009]" : "border-white/25"
                    }`}
                  >
                    {picked ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-inter text-[13.5px] text-white/85">
                    @{c.handle}
                    <span className="ml-2 text-white/35">{c.displayName}</span>
                  </span>
                  {already ? (
                    <span className="shrink-0 font-malt text-[11px] text-white/35">нэмсэн</span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        {error ? <AError>{error}</AError> : null}

        <div className="mt-3 flex items-center gap-2">
          <AButton
            disabled={selectedIds.length === 0 || saving}
            loading={saving}
            onClick={() =>
              run(async () => {
                await assignCampaign(campaignId, selectedIds);
                setSelected({});
              })
            }
          >
            {selectedIds.length > 0
              ? `${selectedIds.length} профайлд нэмэх`
              : "Профайл сонгоно уу"}
          </AButton>
          {selectedIds.length > 0 ? (
            <AButton variant="ghost" onClick={() => setSelected({})}>
              Цуцлах
            </AButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
