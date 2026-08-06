import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
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
  const [collections, picks, links, wishlist, connections, activity, asks] =
    await Promise.all([
      db
        .select()
        .from(collection)
        .where(eq(collection.profileId, profile.id))
        .orderBy(collection.position),
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
      db
        .select()
        .from(wishlistItem)
        .where(eq(wishlistItem.profileId, profile.id))
        .orderBy(wishlistItem.position),
      db.select().from(connection).where(eq(connection.profileId, profile.id)),
      db
        .select()
        .from(activityItem)
        .where(eq(activityItem.profileId, profile.id))
        .orderBy(desc(activityItem.occurredAt)),
      db
        .select()
        .from(askMessage)
        .where(eq(askMessage.profileId, profile.id))
        .orderBy(desc(askMessage.createdAt)),
    ]);

  return {
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
