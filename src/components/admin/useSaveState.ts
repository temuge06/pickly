"use client";

import { useCallback, useRef, useState, useTransition } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * One place for "what is this action doing right now".
 *
 * Admin writes go to the database and then revalidate a page, which is never
 * instant. Without a visible state the button looks inert and people click it
 * again — the single most common complaint about this dashboard. This keeps a
 * status the UI can render, and holds "saved" briefly so the confirmation is
 * actually seen rather than flashing past.
 */
export function useSaveState(holdMs = 2200) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(
    (fn: () => Promise<void>, after?: () => void) => {
      if (timer.current) clearTimeout(timer.current);
      setError(null);
      setStatus("saving");
      startTransition(async () => {
        try {
          await fn();
          setStatus("saved");
          after?.();
          timer.current = setTimeout(() => setStatus("idle"), holdMs);
        } catch (e) {
          setStatus("error");
          setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
        }
      });
    },
    [holdMs],
  );

  // `saving` covers the whole round trip: the action itself plus the
  // revalidation React kicks off afterwards.
  const busy = status === "saving" || isPending;
  return { status, error, busy, run, setError };
}
