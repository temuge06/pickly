import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LapisSongs,
  type SpotifyNotice,
} from "@/components/dashboard/lapis/LapisConnections";
import { LapisLinks } from "@/components/dashboard/lapis/LapisLinks";
import { LapisMedia } from "@/components/dashboard/lapis/LapisMedia";
import { LapisProfile } from "@/components/dashboard/lapis/LapisProfile";
import { ThemeShell } from "@/components/dashboard/lapis/ThemeShell";
import { getCurrentProfile } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { dashboardEnabled, env } from "@/lib/env";

export const metadata = { title: "Профайл — Pickly" };
export const dynamic = "force-dynamic";

/** The OAuth callback comes back with one of these on the URL. */
function spotifyNotice(params: Record<string, string | string[] | undefined>): SpotifyNotice {
  if (params.connected === "spotify") return "connected";
  const error = typeof params.error === "string" ? params.error : null;
  if (error === "spotify_denied") return "denied";
  if (error?.startsWith("spotify_")) return "failed";
  return null;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!dashboardEnabled) redirect("/sign-in");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/onboarding");

  const data = await getDashboardData(profile);
  const spotify = data.connections.find((c) => c.provider === "spotify") ?? null;
  const askNew = data.ask.new.length;
  const flags = data.flags;
  const notice = spotifyNotice(await searchParams);

  return (
    // The editor wears the creator's own palette. Every colour below is a
    // --t-* token so it follows along, including on the two light themes where
    // the old cream-on-near-black literals were unreadable.
    <ThemeShell initialTheme={profile.theme}>
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-[var(--t-border)] bg-[var(--t-bg)]/90 px-4 py-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-md">
        <div className="min-w-0">
          <p className="truncate font-malt text-[15px] font-extrabold text-[var(--t-accent)]">{profile.displayName}</p>
          <p className="truncate font-inter text-[12px] font-medium text-[var(--t-muted)]">@{profile.handle}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={`/${profile.handle}`}
            target="_blank"
            className="flex min-h-[40px] items-center rounded-[12px] px-3 font-malt text-[12px] font-bold text-[var(--t-accent)] transition-colors"
            style={{ background: "color-mix(in srgb, var(--t-accent) 15%, transparent)" }}
          >
            Профайл ↗
          </Link>
          <form action="/auth/sign-out" method="post">
            <button type="submit" className="flex min-h-[40px] items-center rounded-[12px] px-3 font-malt text-[12px] font-semibold text-[var(--t-muted)] transition-colors">
              Гарах
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-col gap-7 pt-5">
        {/* Ask inbox link — absent, not disabled, when staff turned Ask off. */}
        {flags.ask ? (
          <div className="animate-fade-up px-4">
            <Link
              href="/dashboard/ask"
              className="flex items-center justify-between rounded-[16px] px-4 py-3.5 transition-transform active:scale-[0.99]"
              style={{ background: "var(--t-card)", color: "var(--t-on-card)" }}
            >
              <span className="flex items-center gap-2 font-malt text-[14.5px] font-bold">
                <span aria-hidden>💬</span> Ask — асуултын хайрцаг
              </span>
              {askNew > 0 ? (
                <span
                  className="rounded-full px-2.5 py-1 font-malt text-[11px] font-black"
                  style={{ background: "var(--t-accent)", color: "var(--t-on-accent)" }}
                >
                  {askNew} шинэ
                </span>
              ) : (
                <span className="font-malt text-[12px] font-semibold opacity-70">Нээх ↗</span>
              )}
            </Link>
          </div>
        ) : null}

        <LapisProfile profile={profile} />

        {/* One flag covers music + film + book: they are a single
            Entertainment surface, so all three settings areas go together. */}
        {flags.entertainment ? (
          <>
            <LapisSongs
              spotify={spotify}
              trackCount={data.tracks.length}
              configured={env.hasSpotify}
              notice={notice}
            />

            <LapisMedia
              kind="film"
              icon="🎬"
              title="Кино"
              items={data.films}
              disabledHint={env.hasTmdb ? undefined : "TMDB түлхүүр байхгүй тул хайлт хязгаарлагдмал."}
            />

            <LapisMedia kind="book" icon="📚" title="Ном" items={data.books} />
          </>
        ) : null}

        <LapisLinks links={data.links} />
      </div>
    </ThemeShell>
  );
}
