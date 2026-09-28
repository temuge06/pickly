"use client";

/**
 * Catches anything a page throws while rendering — most importantly a database
 * that is down or unreachable — so the visitor gets a readable page with a
 * retry instead of a bare 500.
 */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center p-4 text-center">
      <div>
        <h1 className="text-xl font-semibold">Түр ажиллахгүй байна</h1>
        <p className="mt-2 opacity-70">Something went wrong. Please try again in a moment.</p>
        <button type="button" onClick={reset} className="mt-4 underline">
          Дахин оролдох
        </button>
      </div>
    </main>
  );
}
