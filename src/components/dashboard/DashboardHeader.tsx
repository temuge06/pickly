import Link from "next/link";

/** Sticky top bar for the dashboard, spotly-light. */
export function DashboardHeader({
  handle,
  displayName,
}: {
  handle: string;
  displayName: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-black/[0.06] bg-white/85 px-4 py-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-md">
      <div className="min-w-0">
        <p className="truncate font-header text-[15px] font-black tracking-[-0.2px] text-spotly-ink">
          {displayName}
        </p>
        <p className="truncate font-header text-[12px] font-semibold text-black/40">
          @{handle}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/${handle}`}
          target="_blank"
          className="flex min-h-[40px] items-center rounded-[12px] bg-spotly-accent/10 px-3 font-header text-[12px] font-bold text-[#c23361] transition-colors active:bg-spotly-accent/15"
        >
          Профайл ↗
        </Link>
        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="flex min-h-[40px] items-center rounded-[12px] px-3 font-header text-[12px] font-semibold text-black/45 transition-colors active:text-black/70"
          >
            Гарах
          </button>
        </form>
      </div>
    </header>
  );
}
