import { notFound } from "next/navigation";
import { LapisMusic } from "@/components/lapis/LapisMusic";
import {
  LapisAsk,
  LapisBottomNav,
  LapisHeader,
  LapisMyPicks,
  LapisNotForMe,
  LapisSimilar,
  LapisStatusBar,
  LapisTopPicks,
  LapisWishlist,
} from "@/components/lapis/sections";
import { getOtherCreators, getPublicProfile } from "@/lib/data/public-profile";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const data = await getPublicProfile(handle);
  if (!data) notFound();

  const { profile, collections, picks, tracks, films, books, wishlist, askMessages } = data;
  const creators = await getOtherCreators(profile.id);

  // Split picks into the profile's three product sections:
  //   Not For Me   = status wont_rebuy
  //   My Picks     = the rest, grouped by collection
  //   Top Picks    = the rest, ungrouped (no collection)
  const notForMe = picks.filter((p) => p.status === "wont_rebuy");
  const keep = picks.filter((p) => p.status !== "wont_rebuy");
  const topPicks = keep.filter((p) => p.collectionId === null);
  const picksByCollection: Record<string, typeof picks> = {};
  for (const p of keep) {
    if (p.collectionId) (picksByCollection[p.collectionId] ??= []).push(p);
  }

  return (
    <div className="min-h-dvh bg-neutral-800 sm:py-8">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[402px] flex-col overflow-x-clip bg-[#2a1617] font-malt shadow-[0_0_80px_rgba(0,0,0,0.4)] sm:min-h-0">
        <div className="flex-1">
          <LapisStatusBar />
          <LapisHeader profile={profile} />
          <LapisMusic tracks={tracks} films={films} books={books} />
          <LapisTopPicks picks={topPicks} />
          <LapisMyPicks collections={collections} picksByCollection={picksByCollection} />
          <LapisWishlist items={wishlist} />
          <LapisNotForMe picks={notForMe} />
          <LapisAsk
            handle={profile.handle}
            askEnabled={profile.askEnabled}
            questions={askMessages}
          />
          <LapisSimilar creators={creators} />
        </div>
        <LapisBottomNav />
      </div>
    </div>
  );
}
