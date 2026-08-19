import { and, desc, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import {
  activityItem,
  askMessage,
  collection,
  connection,
  link,
  pick,
  profile,
  wishlistItem,
} from "@/db/schema";
import { getProfileCampaigns, type ProfileCampaign } from "@/lib/data/campaigns";
import { getFeatureFlags } from "@/lib/data/features";
import { env } from "@/lib/env";
import { ALL_ENABLED, type FeatureFlags } from "@/lib/features";
import {
  demoAskMessages,
  demoBooks,
  demoCollections,
  demoFilms,
  demoLinks,
  demoPicks,
  demoProfile,
  demoTracks,
} from "@/lib/fixtures/demo-profile";

type Profile = typeof profile.$inferSelect;
type Collection = typeof collection.$inferSelect;
type Pick = typeof pick.$inferSelect;
type ActivityItem = typeof activityItem.$inferSelect;
type Link = typeof link.$inferSelect;
type AskMessage = typeof askMessage.$inferSelect;
type Connection = typeof connection.$inferSelect;
type WishlistItem = typeof wishlistItem.$inferSelect;

export type PublicProfileData = {
  profile: Profile;
  collections: Collection[];
  picks: Pick[];
  tracks: ActivityItem[];
  films: ActivityItem[];
  books: ActivityItem[];
  links: Link[];
  wishlist: WishlistItem[];
  askMessages: AskMessage[];
  /** Top Picks is a sponsored-banner shelf now, not a product shelf. */
  campaigns: ProfileCampaign[];
  flags: FeatureFlags;
};

/**
 * Everything the public /[handle] page needs, in one call. Falls back to
 * fixtures when no database is configured, so the finished product renders with
 * zero keys. Provider sections whose connection is not `active` are dropped
 * here — a revoked/errored sync must never surface stale data as if it were
 * live.
 */
export async function getPublicProfile(
  handle: string,
): Promise<PublicProfileData | null> {
  if (!env.hasDatabase) {
    return handle.toLowerCase() === demoProfile.handle
      ? {
          profile: demoProfile,
          collections: demoCollections,
          picks: demoPicks,
          tracks: demoTracks,
          films: demoFilms,
          books: demoBooks,
          links: demoLinks,
          wishlist: [],
          askMessages: demoAskMessages,
          campaigns: [],
          flags: { ...ALL_ENABLED },
        }
      : null;
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(profile)
    .where(eq(profile.handle, handle))
    .limit(1);
  const p = rows[0];
  if (!p) return null;

  // Flags decide what we even ASK the database for. A disabled section must
  // leave no trace in the response, so we skip its query entirely rather than
  // fetching and filtering later — nothing to leak into the HTML payload.
  const flags = await getFeatureFlags(p.id);

  const [collections, picks, links, wishlist, connections, activity, asks, campaigns] =
    await Promise.all([
      flags.my_picks
        ? db
            .select()
            .from(collection)
            .where(eq(collection.profileId, p.id))
            .orderBy(collection.position)
        : [],
      db
        .select()
        .from(pick)
        .where(and(eq(pick.profileId, p.id), eq(pick.isActive, true)))
        .orderBy(pick.position),
      db
        .select()
        .from(link)
        .where(eq(link.profileId, p.id))
        .orderBy(link.position),
      flags.wishlist
        ? db
            .select()
            .from(wishlistItem)
            .where(and(eq(wishlistItem.profileId, p.id), eq(wishlistItem.isActive, true)))
            .orderBy(wishlistItem.position)
        : [],
      db.select().from(connection).where(eq(connection.profileId, p.id)),
      flags.entertainment
        ? db
            .select()
            .from(activityItem)
            .where(eq(activityItem.profileId, p.id))
            .orderBy(desc(activityItem.occurredAt))
        : [],
      flags.ask
        ? db
            .select()
            .from(askMessage)
            .where(
              and(
                eq(askMessage.profileId, p.id),
                eq(askMessage.isPublic, true),
                eq(askMessage.status, "answered"),
              ),
            )
            .orderBy(desc(askMessage.answeredAt))
        : [],
      flags.top_picks ? getProfileCampaigns(p.id) : [],
    ]);

  // A provider section is only live when its connection is active. Manual
  // items (books, manually-added films) have no connection and always show.
  const inactiveProviders = new Set(
    connections
      .filter((c: Connection) => c.status !== "active")
      .map((c: Connection) => c.provider as string),
  );
  const visibleActivity = activity.filter(
    (a: ActivityItem) => !inactiveProviders.has(a.provider),
  );

  // All picks come back in one query, then each section's flag strips its own
  // rows HERE — otherwise the page would ship hidden products to the browser
  // and merely decline to draw them.
  //   not_for_me → status wont_rebuy
  //   top_picks  → everything else with no collection
  //   my_picks   → everything else that has one
  // Top Picks renders CAMPAIGNS now, so an ungrouped pick has no section to
  // appear in and is dropped here rather than shipped to a browser that will
  // never draw it. The rows are untouched in the database.
  //   not_for_me → status wont_rebuy
  //   my_picks   → anything else with a collection
  const visiblePicks = picks.filter((k: Pick) => {
    if (k.status === "wont_rebuy") return flags.not_for_me;
    return k.collectionId !== null && flags.my_picks;
  });

  return {
    profile: p,
    collections,
    picks: visiblePicks,
    links,
    wishlist,
    tracks: visibleActivity.filter((a: ActivityItem) => a.kind === "track"),
    films: visibleActivity.filter((a: ActivityItem) => a.kind === "film"),
    books: visibleActivity.filter((a: ActivityItem) => a.kind === "book"),
    askMessages: asks,
    campaigns,
    flags,
  };
}

/** Handles for static params / sitemaps. Fixtures when DB-less. */
export async function getAllHandles(): Promise<string[]> {
  if (!env.hasDatabase) return [demoProfile.handle];
  const db = getDb();
  const rows = await db.select({ handle: profile.handle }).from(profile);
  return rows.map((r: { handle: string }) => r.handle);
}

export type OtherCreator = {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
};

/** Other creators for the "Similar" shelf — everyone except the current
 * profile. Fixture-less when no DB (returns []). */
export async function getOtherCreators(
  excludeId: string,
  limit = 6,
): Promise<OtherCreator[]> {
  if (!env.hasDatabase) return [];
  const db = getDb();
  const rows = await db
    .select({
      handle: profile.handle,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
    })
    .from(profile)
    .where(ne(profile.id, excludeId))
    .orderBy(desc(profile.createdAt))
    .limit(limit);
  return rows;
}
