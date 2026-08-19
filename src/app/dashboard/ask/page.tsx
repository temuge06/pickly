import Link from "next/link";
import { redirect } from "next/navigation";
import { AskInbox } from "@/components/dashboard/AskInbox";
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
    <div className="min-h-dvh bg-[#2a1617] sm:bg-neutral-900 sm:py-8">
      {/* Matches /dashboard: the global body colour otherwise shows in the
          overscroll bounce, and the width cap is a desktop-only device frame. */}
      <style
        dangerouslySetInnerHTML={{
          __html: "html,body{background-color:#2a1617;overscroll-behavior-y:none}",
        }}
      />
      <div className="mx-auto min-h-dvh w-full overflow-x-clip bg-[#2a1617] pb-16 sm:min-h-0 sm:max-w-[430px] sm:shadow-[0_0_80px_rgba(0,0,0,0.4)]">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-[#7b4c46]/60 bg-[#2a1617]/90 px-4 py-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              href="/dashboard"
              aria-label="Буцах"
              className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[11px] bg-white/[0.06] font-malt text-[15px] text-[#feedd5]/70 transition-colors active:bg-white/[0.12]"
            >
              ←
            </Link>
            <div className="min-w-0">
              <p className="truncate font-malt text-[15px] font-extrabold text-white">Ask</p>
              <p className="truncate font-inter text-[12px] font-medium text-[#feedd5]/40">
                Асуултын хайрцаг
              </p>
            </div>
          </div>
          {newCount > 0 ? (
            <span className="shrink-0 rounded-full bg-[#fe7f42] px-2.5 py-1 font-malt text-[11px] font-black text-[#3a1310]">
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
      </div>
    </div>
  );
}
