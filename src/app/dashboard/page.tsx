import Link from "next/link";
import { redirect } from "next/navigation";
import { LapisCollections } from "@/components/dashboard/lapis/LapisCollections";
import { LapisLetterboxd, LapisSongs } from "@/components/dashboard/lapis/LapisConnections";
import { LapisLinks } from "@/components/dashboard/lapis/LapisLinks";
import { LapisMedia } from "@/components/dashboard/lapis/LapisMedia";
import { LapisPicks } from "@/components/dashboard/lapis/LapisPicks";
import { LapisProfile } from "@/components/dashboard/lapis/LapisProfile";
import { LapisWishlistManager } from "@/components/dashboard/lapis/LapisWishlist";
import { getCurrentProfile } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/dashboard";
import { dashboardEnabled, env } from "@/lib/env";

export const metadata = { title: "Профайл — Pickly" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!dashboardEnabled) redirect("/sign-in");
  const profile = await getCurrentProfile();
  if (!profile) redirect("/onboarding");

  const data = await getDashboardData(profile);
  const spotify = data.connections.find((c) => c.provider === "spotify") ?? null;
  const letterboxd = data.connections.find((c) => c.provider === "letterboxd") ?? null;
  const askNew = data.ask.new.length;
  const flags = data.flags;

  return (
    <div className="min-h-dvh bg-neutral-900 sm:py-8">
      <div className="mx-auto min-h-dvh w-full max-w-[430px] overflow-x-clip bg-[#2a1617] pb-16 shadow-[0_0_80px_rgba(0,0,0,0.4)] sm:min-h-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-[#7b4c46]/60 bg-[#2a1617]/90 px-4 py-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-md">
          <div className="min-w-0">
            <p className="truncate font-malt text-[15px] font-extrabold text-white">{profile.displayName}</p>
            <p className="truncate font-inter text-[12px] font-medium text-[#feedd5]/40">@{profile.handle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={`/${profile.handle}`} target="_blank" className="flex min-h-[40px] items-center rounded-[12px] bg-[#fe7f42]/15 px-3 font-malt text-[12px] font-bold text-[#fe7f42] transition-colors active:bg-[#fe7f42]/25">
              Профайл ↗
            </Link>
            <form action="/auth/sign-out" method="post">
              <button type="submit" className="flex min-h-[40px] items-center rounded-[12px] px-3 font-malt text-[12px] font-semibold text-[#feedd5]/45 transition-colors active:text-[#feedd5]/80">
                Гарах
              </button>
            </form>
          </div>
        </header>

        <div className="flex flex-col gap-7 pt-5">
          {/* Ask inbox link — absent, not disabled, when staff turned Ask off. */}
          {flags.ask ? (
          <div className="animate-fade-up px-4">
            <Link href="/dashboard/ask" className="flex items-center justify-between rounded-[16px] bg-[#b22c20] px-4 py-3.5 transition-transform active:scale-[0.99]">
              <span className="flex items-center gap-2 font-malt text-[14.5px] font-bold text-[#feedd5]">
                <span aria-hidden>💬</span> Ask — асуултын хайрцаг
              </span>
              {askNew > 0 ? (
                <span className="rounded-full bg-[#fe7f42] px-2.5 py-1 font-malt text-[11px] font-black text-[#3a1310]">{askNew} шинэ</span>
              ) : (
                <span className="font-malt text-[12px] font-semibold text-[#feedd5]/50">Нээх ↗</span>
              )}
            </Link>
          </div>
          ) : null}

          <LapisProfile profile={profile} />
          <LapisPicks picks={data.picks} collections={data.collections} notForMeEnabled={flags.not_for_me} />
          {flags.my_picks ? (
            <LapisCollections
              collections={data.collections}
              pickCounts={data.picks.reduce<Record<string, number>>((acc, p) => {
                if (p.collectionId) acc[p.collectionId] = (acc[p.collectionId] ?? 0) + 1;
                return acc;
              }, {})}
            />
          ) : null}
          {flags.wishlist ? <LapisWishlistManager items={data.wishlist} /> : null}

          {/* One flag covers music + film + book: they are a single
              Entertainment surface, so all three settings areas go together. */}
          {flags.entertainment ? (
            <>
              <LapisSongs spotify={spotify} trackCount={data.tracks.length} configured={env.hasSpotify} />

              <LapisMedia
                kind="film"
                icon="🎬"
                title="Кино"
                items={data.films}
                disabledHint={env.hasTmdb ? undefined : "TMDB түлхүүр байхгүй тул хайлт хязгаарлагдмал. Letterboxd-ээр синк хийж болно."}
                extra={<LapisLetterboxd connection={letterboxd} />}
              />

              <LapisMedia kind="book" icon="📚" title="Ном" items={data.books} />
            </>
          ) : null}

          <LapisLinks links={data.links} />
        </div>
      </div>
    </div>
  );
}
