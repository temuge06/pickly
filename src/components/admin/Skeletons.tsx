/**
 * Route-level skeletons. Next.js renders the nearest `loading.tsx` the instant
 * a navigation starts, so the admin shows structure immediately instead of
 * appearing frozen while the server component fetches.
 *
 * These mirror the real layouts closely enough that content swaps in without
 * the page jumping around.
 */

export function Bar({ w = "100%", h = 14 }: { w?: string; h?: number }) {
  return (
    <span
      className="skeleton-dark block rounded-[6px]"
      style={{ width: w, height: h }}
    />
  );
}

export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <section className="rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="mb-4 flex flex-col gap-2">
        <Bar w="38%" h={15} />
        <Bar w="70%" h={11} />
      </div>
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[12px] border border-white/[0.07] bg-white/[0.02] px-3.5 py-3"
          >
            <span className="skeleton-dark h-10 w-10 shrink-0 rounded-full" />
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Bar w="45%" />
              <Bar w="28%" h={11} />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-3.5">
      <span className="skeleton-dark h-12 w-12 shrink-0 rounded-full" />
      <span className="flex flex-col gap-2">
        <Bar w="180px" h={18} />
        <Bar w="110px" h={12} />
      </span>
    </div>
  );
}
