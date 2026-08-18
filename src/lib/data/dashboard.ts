import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { getFeatureFlags } from "@/lib/data/features";
import {
  activityItem,
  askMessage,
  collection,
  connection,
  link,
  pick,
  wishlistItem,
} from "@/db/schema";

type Profile = { id: string };

/**
 * Everything the dashboard needs for one creator, scoped by their own
 * profile.id (the ownership anchor derived from the session). Ordered for
 * direct rendering.
 */
export async function getDashboardData(profile: Profile) {
  const db = getDb();
  // Same rule as the public page: a feature an admin switched off is not
  // queried, so the creator's own dashboard never ships data for a section
  // they can no longer see.
  const flags = await getFeatureFlags(profile.id);
  const [collections, picks, links, wishlist, connections, activity, asks] =
    await Promise.all([
      flags.my_picks
        ? db
            .select()
            .from(collection)
            .where(eq(collection.profileId, profile.id))
            .orderBy(collection.position)
        : [],
      db
        .select()
        .from(pick)
        .where(eq(pick.profileId, profile.id))
        .orderBy(pick.position),
      db
        .select()
        .from(link)
        .where(eq(link.profileId, profile.id))
        .orderBy(link.position),
      flags.wishlist
        ? db
            .select()
            .from(wishlistItem)
            .where(eq(wishlistItem.profileId, profile.id))
            .orderBy(wishlistItem.position)
        : [],
      db.select().from(connection).where(eq(connection.profileId, profile.id)),
      flags.entertainment
        ? db
            .select()
            .from(activityItem)
            .where(eq(activityItem.profileId, profile.id))
            .orderBy(desc(activityItem.occurredAt))
        : [],
      flags.ask
        ? db
            .select()
            .from(askMessage)
            .where(eq(askMessage.profileId, profile.id))
            .orderBy(desc(askMessage.createdAt))
        : [],
    ]);

  return {
    flags,
    collections,
    picks,
    links,
    wishlist,
    connections,
    films: activity.filter((a) => a.kind === "film"),
    books: activity.filter((a) => a.kind === "book"),
    tracks: activity.filter((a) => a.kind === "track"),
    ask: {
      new: asks.filter((m) => m.status === "new"),
      answered: asks.filter((m) => m.status === "answered"),
      hidden: asks.filter(
        (m) => m.status === "hidden" || m.status === "blocked",
      ),
    },
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
