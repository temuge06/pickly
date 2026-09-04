import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { LapisMusic } from "@/components/lapis/LapisMusic";
import {
  LapisAsk,
  LapisFooter,
  LapisHeader,
  LapisMyPicks,
  LapisNotForMe,
  LapisPromos,
  LapisQuickLinks,
  LapisSimilar,
  LapisStatusBar,
  LapisTopPicks,
  LapisWishlist,
} from "@/components/lapis/sections";
import { getCurrentProfile, getSessionUser } from "@/lib/auth/session";
import {
  getOtherCreators,
  getPendingAsks,
  getPublicProfile,
} from "@/lib/data/public-profile";
import { getUnreadNotificationCount } from "@/lib/data/notifications";
import { getTheme, themeStyle } from "@/lib/themes";
import { LOCALE_COOKIE, parseLocale, translator } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  // Locale is a cookie read during the render, not client state: the page is a
  // server component, so this is what puts the right language in the first byte
  // of HTML instead of flashing Mongolian and then swapping.
  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const t = translator(locale);
  const data = await getPublicProfile(handle);
  if (!data) notFound();

  const { profile, collections, picks, tracks, films, books, links, wishlist, askMessages, campaigns, promos, flags } = data;
  const creators = await getOtherCreators(profile.id);

  // Owner check, server-side. A logged-out visitor or a different signed-in
  // creator gets HTML with no Edit button in it at all — not a hidden or
  // disabled one, so there is nothing to reveal by editing CSS or the DOM.
  const theme = getTheme(profile.theme);
  const viewer = await getSessionUser();
  const isOwner = viewer !== null && viewer.id === profile.userId;

  // The signed-in creator's OWN profile row, used for two viewer-only bits of
  // chrome: the bell (mine only) and the "back to my profile" control (only
  // when I am looking at someone else). Both resolve server-side, so a visitor
  // receives HTML that contains neither.
  const me = viewer ? await getCurrentProfile() : null;
  const unread = isOwner && me ? await getUnreadNotificationCount(me) : 0;
  const backTo = me && me.id !== profile.id ? me.handle : null;

  // Private rows, so they are fetched only once ownership is settled — never
  // as part of the shared profile query every visitor triggers.
  // Narrowed to what the inline inbox draws: the row also carries the asker's
  // fingerprint and moderation state, and none of that belongs in a payload
  // sent to a browser.
  const pendingAsks =
    isOwner && flags.ask
      ? (await getPendingAsks(profile.id)).map((q) => ({
          id: q.id,
          body: q.body,
        }))
      : null;

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
      <div className="relative mx-auto flex min-h-dvh w-full flex-col overflow-x-clip bg-[var(--t-bg)] font-gip sm:min-h-0 sm:max-w-[402px] sm:shadow-[0_0_80px_rgba(0,0,0,0.4)]">
        <div className="flex-1">
          <LapisStatusBar
            bell={isOwner ? { unread } : null}
            backTo={backTo}
            handle={profile.handle}
            locale={locale}
          />
          <LapisHeader profile={profile} isOwner={isOwner} locale={locale} />
          {/* Section order follows the MVP design (Figma MVP1, 1208:9944):
              Quick Links sit directly under the bio shelf, because they are
              the creator's own destinations and the design treats them as part
              of the identity block rather than as an exit at the bottom of the
              page. The three product shelves and Similar are not drawn in the
              MVP frames; they keep their existing relative order and slot in
              after the promo tickets, so nothing that used to be on the page
              has moved past a section it used to precede.

              Flags are resolved server-side: a disabled section is not
              rendered at all, and getPublicProfile already skipped its query,
              so the viewer receives no trace of it. */}
          <LapisQuickLinks links={links} locale={locale} />
          {flags.entertainment ? (
            <LapisMusic
              tracks={tracks}
              films={films}
              books={books}
              labels={{
                music: t("tabMusic"),
                films: t("tabFilms"),
                books: t("tabBooks"),
                listen: t("listen"),
                stop: t("stop"),
                series: t("series"),
              }}
            />
          ) : null}
          {flags.top_picks ? (
            <LapisTopPicks campaigns={campaigns} handle={profile.handle} locale={locale} />
          ) : null}
          <LapisPromos promos={promos} locale={locale} />
          {flags.my_picks ? (
            <LapisMyPicks collections={collections} picksByCollection={picksByCollection} locale={locale} />
          ) : null}
          {flags.wishlist ? (
            <LapisWishlist items={wishlist} recommenders={recommenderAvatars} locale={locale} />
          ) : null}
          {flags.not_for_me ? (
            <LapisNotForMe picks={notForMe} locale={locale} />
          ) : null}
          {flags.ask ? (
            <LapisAsk
              handle={profile.handle}
              avatarUrl={profile.avatarUrl}
              displayName={profile.displayName}
              askEnabled={profile.askEnabled}
              questions={askMessages}
              pending={pendingAsks}
              locale={locale}
            />
          ) : null}
          <LapisSimilar creators={creators} locale={locale} />
        </div>
        <LapisFooter locale={locale} />
      </div>
    </div>
  );
}
