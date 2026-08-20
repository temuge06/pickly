import Link from "next/link";
import { redirect } from "next/navigation";
import { AskInbox } from "@/components/dashboard/AskInbox";
import { ThemeShell } from "@/components/dashboard/lapis/ThemeShell";
import { getCurrentProfile } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { dashboardEnabled } from "@/lib/env";

export const metadata = { title: "Ask — Pickly" };
export const dynamic = "force-dynamic";

export default async function AskInboxPage() {
  if (!dashboardEnabled) redirect("/sign-in");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/onboarding");

  const data = await getDashboardData(profile);
  // Hiding the dashboard's Ask tile is not enough — this route has to close
  // too, or a creator who bookmarked it keeps a working inbox for a feature
  // staff switched off.
  if (!data.flags.ask) redirect("/dashboard");

  const newCount = data.ask.new.length;

  return (
    // Same themed shell as /dashboard, so the inbox follows the creator's
    // palette instead of staying pinned to On Fire's near-black.
    <ThemeShell initialTheme={profile.theme}>
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-[var(--t-border)] bg-[var(--t-bg)]/90 px-4 py-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/dashboard"
            aria-label="Буцах"
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] bg-[var(--t-field)] font-malt text-[15px] text-[var(--t-text)] transition-colors"
          >
            ←
          </Link>
          <div className="min-w-0">
            <p className="truncate font-malt text-[15px] font-extrabold text-[var(--t-accent)]">Ask</p>
            <p className="truncate font-inter text-[12px] font-medium text-[var(--t-muted)]">
              Асуултын хайрцаг
            </p>
          </div>
        </div>
        {newCount > 0 ? (
          <span
            className="shrink-0 rounded-full px-2.5 py-1 font-malt text-[11px] font-black"
            style={{ background: "var(--t-accent)", color: "var(--t-on-accent)" }}
          >
            {newCount} шинэ
          </span>
        ) : null}
      </header>

      <div className="pt-5">
        <AskInbox
          handle={profile.handle}
          askEnabled={profile.askEnabled}
          askPrompt={profile.askPrompt}
          messages={{
            new: data.ask.new,
            answered: data.ask.answered,
            hidden: data.ask.hidden,
          }}
        />
      </div>
    </ThemeShell>
  );
}
