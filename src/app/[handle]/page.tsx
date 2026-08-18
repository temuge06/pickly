import { notFound } from "next/navigation";
import { LapisMusic } from "@/components/lapis/LapisMusic";
import {
  LapisAsk,
  LapisHeader,
  LapisMyPicks,
  LapisNotForMe,
  LapisSimilar,
  LapisStatusBar,
  LapisTopPicks,
  LapisWishlist,
} from "@/components/lapis/sections";
import { getSessionUser } from "@/lib/auth/session";
import { getOtherCreators, getPublicProfile } from "@/lib/data/public-profile";
import { themeStyle } from "@/lib/themes";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const data = await getPublicProfile(handle);
  if (!data) notFound();

  const { profile, collections, picks, tracks, films, books, wishlist, askMessages, flags } = data;
  const creators = await getOtherCreators(profile.id);

  // Owner check, server-side. A logged-out visitor or a different signed-in
  // creator gets HTML with no Edit button in it at all — not a hidden or
  // disabled one, so there is nothing to reveal by editing CSS or the DOM.
  const viewer = await getSessionUser();
  const isOwner = viewer !== null && viewer.id === profile.userId;

  // Demo recommenders: profile pictures of other creators, shown as the small
  // avatar stack on each Top Pick. (No per-product recommendation data yet.)
  const recommenderAvatars = creators
    .map((c) => c.avatarUrl)
    .filter((u): u is string => !!u);

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
    // The creator's chosen palette is written as CSS custom properties on the
    // profile root, server-side. Every themed surface below reads a var, so the
    // correct colours are in the first byte of HTML — no client JS, and no
    // flash of the default theme before the real one loads.
    <div className="min-h-dvh bg-neutral-800 sm:py-8" style={themeStyle(profile.theme)}>
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[402px] flex-col overflow-x-clip bg-[var(--t-bg)] font-malt shadow-[0_0_80px_rgba(0,0,0,0.4)] sm:min-h-0">
        <div className="flex-1">
          <LapisStatusBar />
          <LapisHeader profile={profile} isOwner={isOwner} />
          {/* Flags are resolved server-side: a disabled section is not rendered
              at all, and getPublicProfile already skipped its query, so the
              viewer receives no trace of it. */}
          {flags.entertainment ? (
            <LapisMusic tracks={tracks} films={films} books={books} />
          ) : null}
          {flags.top_picks ? (
            <LapisTopPicks picks={topPicks} recommenders={recommenderAvatars} />
          ) : null}
          {flags.my_picks ? (
            <LapisMyPicks collections={collections} picksByCollection={picksByCollection} />
          ) : null}
          {flags.wishlist ? (
            <LapisWishlist items={wishlist} recommenders={recommenderAvatars} />
          ) : null}
          {flags.not_for_me ? (
            <LapisNotForMe picks={notForMe} recommenders={recommenderAvatars} />
          ) : null}
          {flags.ask ? (
            <LapisAsk
              handle={profile.handle}
              askEnabled={profile.askEnabled}
              questions={askMessages}
            />
          ) : null}
          <LapisSimilar creators={creators} />
        </div>
      </div>
    </div>
  );
}
