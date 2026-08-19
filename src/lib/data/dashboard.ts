import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { getFeatureFlags } from "@/lib/data/features";
import { activityItem, askMessage, connection, link } from "@/db/schema";

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
  // Products (picks, collections, wishlist) are admin-curated and no longer
  // shown here, so the dashboard does not query them at all — three fewer
  // round trips on every load.
  const [links, connections, activity, asks] =
    await Promise.all([
      db
        .select()
        .from(link)
        .where(eq(link.profileId, profile.id))
        .orderBy(link.position),
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
    links,
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
