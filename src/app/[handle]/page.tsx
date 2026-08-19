import { notFound } from "next/navigation";
import { LapisMusic } from "@/components/lapis/LapisMusic";
import {
  LapisAsk,
  LapisHeader,
  LapisMyPicks,
  LapisNotForMe,
  LapisPromos,
  LapisSimilar,
  LapisStatusBar,
  LapisTopPicks,
  LapisWishlist,
} from "@/components/lapis/sections";
import { getSessionUser } from "@/lib/auth/session";
import { getOtherCreators, getPublicProfile } from "@/lib/data/public-profile";
import { getTheme, themeStyle } from "@/lib/themes";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const data = await getPublicProfile(handle);
  if (!data) notFound();

  const { profile, collections, picks, tracks, films, books, wishlist, askMessages, campaigns, promos, flags } = data;
  const creators = await getOtherCreators(profile.id);

  // Owner check, server-side. A logged-out visitor or a different signed-in
  // creator gets HTML with no Edit button in it at all — not a hidden or
  // disabled one, so there is nothing to reveal by editing CSS or the DOM.
  const theme = getTheme(profile.theme);
  const viewer = await getSessionUser();
  const isOwner = viewer !== null && viewer.id === profile.userId;

  // Demo recommenders: profile pictures of other creators, shown as the small
  // avatar stack on each Top Pick. (No per-product recommendation data yet.)
  const recommenderAvatars = creators
    .map((c) => c.avatarUrl)
    .filter((u): u is string => !!u);

  // Split picks into the profile's three product sections:
  //   Not For Me = status wont_rebuy
  //   My Picks   = the rest, grouped by collection
  // Top Picks is no longer sourced from picks at all — it renders campaigns.
  const notForMe = picks.filter((p) => p.status === "wont_rebuy");
  const keep = picks.filter((p) => p.status !== "wont_rebuy");
  const picksByCollection: Record<string, typeof picks> = {};
  for (const p of keep) {
    if (p.collectionId) (picksByCollection[p.collectionId] ??= []).push(p);
  }

  return (
    // The creator's chosen palette is written as CSS custom properties on the
    // profile root, server-side. Every themed surface below reads a var, so the
    // correct colours are in the first byte of HTML — no client JS, and no
    // flash of the default theme before the real one loads.
    <div
      className="min-h-dvh bg-[var(--t-bg)] sm:bg-neutral-800 sm:py-8"
      style={themeStyle(profile.theme)}
    >
      {/* The global body colour (--color-wall, a dark purple) is what shows in
          the rubber-band area when a phone overscrolls past the top or bottom.
          Repaint html/body in THIS profile's background so the bounce is
          invisible, and stop the chain from propagating to the viewport.
          Server-rendered from our own token table — no client JS, no flash. */}
      <style
        dangerouslySetInnerHTML={{
          __html: `html,body{background-color:${theme.tokens.bg};overscroll-behavior-y:none}`,
        }}
      />
      {/* Full-bleed on a phone; the 402px "device frame" is a desktop-only
          treatment. Capping the width on mobile left the neutral backdrop
          showing as grey margins down both edges. */}
      <div className="relative mx-auto flex min-h-dvh w-full flex-col overflow-x-clip bg-[var(--t-bg)] font-malt sm:min-h-0 sm:max-w-[402px] sm:shadow-[0_0_80px_rgba(0,0,0,0.4)]">
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
            <LapisTopPicks campaigns={campaigns} handle={profile.handle} />
          ) : null}
          {flags.my_picks ? (
            <LapisMyPicks collections={collections} picksByCollection={picksByCollection} />
          ) : null}
          <LapisPromos promos={promos} />
          {flags.wishlist ? (
            <LapisWishlist items={wishlist} recommenders={recommenderAvatars} />
          ) : null}
          {flags.not_for_me ? (
            <LapisNotForMe picks={notForMe} />
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
