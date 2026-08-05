import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CollectionsManager } from "@/components/dashboard/CollectionsManager";
import { LetterboxdConnect } from "@/components/dashboard/LetterboxdConnect";
import { LinksManager } from "@/components/dashboard/LinksManager";
import { ListeningManager } from "@/components/dashboard/ListeningManager";
import { MediaManager } from "@/components/dashboard/MediaManager";
import { PicksManager } from "@/components/dashboard/PicksManager";
import { ProfileEditor } from "@/components/dashboard/ProfileEditor";
import { getCurrentProfile } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { dashboardEnabled, env } from "@/lib/env";

export const metadata = { title: "Хяналтын самбар — Pickly" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!dashboardEnabled) redirect("/sign-in");

  const profile = await getCurrentProfile();
  if (!profile) redirect("/onboarding");

  const data = await getDashboardData(profile);
  const spotify = data.connections.find((c) => c.provider === "spotify") ?? null;
  const letterboxd =
    data.connections.find((c) => c.provider === "letterboxd") ?? null;
  const askNewCount = data.ask.new.length;

  return (
    <div className="min-h-dvh bg-neutral-200 sm:py-8">
      <div className="mx-auto min-h-dvh w-full max-w-[430px] overflow-x-clip bg-spotly-bg pb-16 shadow-[0_0_80px_rgba(0,0,0,0.12)] sm:min-h-0">
        <DashboardHeader handle={profile.handle} displayName={profile.displayName} />

        <div className="flex flex-col gap-7 pt-5">
          <div className="animate-fade-up px-4">
            <Link
              href="/dashboard/ask"
              className="flex items-center justify-between rounded-[16px] bg-spotly-ink px-4 py-3.5 transition-transform active:scale-[0.99]"
            >
              <span className="flex items-center gap-2 font-header text-[14.5px] font-bold text-white">
                <span aria-hidden>💬</span>
                Ask — асуултын хайрцаг
              </span>
              {askNewCount > 0 ? (
                <span className="rounded-full bg-spotly-accent px-2.5 py-1 font-header text-[11px] font-black text-white">
                  {askNewCount} шинэ
                </span>
              ) : (
                <span className="font-header text-[12px] font-semibold text-white/50">
                  Нээх ↗
                </span>
              )}
            </Link>
          </div>

          <PicksManager picks={data.picks} collections={data.collections} />
          <CollectionsManager collections={data.collections} />

          <ListeningManager
            spotify={spotify}
            trackCount={data.tracks.length}
            spotifyConfigured={env.hasSpotify}
          />

          <div className="flex flex-col gap-2.5">
            <div className="px-4">
              <LetterboxdConnect connection={letterboxd} />
            </div>
            <MediaManager
              kind="film"
              label="Watching"
              icon="🎬"
              items={data.films}
              searchDisabledHint={
                env.hasTmdb
                  ? undefined
                  : "TMDB түлхүүр байхгүй тул хайлт хязгаарлагдмал. Letterboxd-ээр синк хийж болно."
              }
            />
          </div>

          <MediaManager kind="book" label="Reading" icon="📚" items={data.books} />

          <LinksManager links={data.links} />

          <ProfileEditor profile={profile} />
        </div>
      </div>
    </div>
  );
}
