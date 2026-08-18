import Link from "next/link";
import { redirect } from "next/navigation";
import { Canvas } from "@/components/ui/Canvas";
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

  return (
    <Canvas>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-paper/10 bg-wall/95 px-4 py-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur">
        <Link href="/dashboard" className="font-mono text-[13px] text-paper/60">
          ←
        </Link>
        <h1 className="font-display text-[16px] font-bold text-paper">Ask</h1>
      </header>

      <div className="pt-5">
        <AskInbox
          handle={profile.handle}
          askEnabled={profile.askEnabled}
          askPrompt={profile.askPrompt}
          collections={data.collections}
          messages={{
            new: data.ask.new,
            answered: data.ask.answered,
            hidden: data.ask.hidden,
          }}
        />
      </div>
    </Canvas>
  );
}
