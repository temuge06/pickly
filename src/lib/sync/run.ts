import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { activityItem, connection } from "@/db/schema";
import { spotifyAdapter } from "./spotify";
import { FeedNotFoundError, letterboxdAdapter } from "./letterboxd";
import { RevokedError, type Connection, type ProviderAdapter } from "./types";

const ADAPTERS: Record<string, ProviderAdapter> = {
  spotify: spotifyAdapter,
  letterboxd: letterboxdAdapter,
};

export type SyncOutcome = {
  connectionId: string;
  provider: string;
  status: "active" | "error" | "revoked";
  itemsWritten: number;
  error?: string;
};

/**
 * Runs one connection's adapter and reconciles connection health. This is the
 * single place that decides active/error/revoked — the health rules the brief
 * calls "not optional" live here, so a dead sync can never keep serving stale
 * data as if it were live (the runner marks the connection, and the public page
 * hides non-active sections).
 */
export async function syncConnection(conn: Connection): Promise<SyncOutcome> {
  const db = getDb();
  const adapter = ADAPTERS[conn.provider];
  if (!adapter) {
    return {
      connectionId: conn.id,
      provider: conn.provider,
      status: "error",
      itemsWritten: 0,
      error: `No adapter for provider "${conn.provider}".`,
    };
  }

  try {
    const items = await adapter.sync(conn);

    let written = 0;
    for (const item of items) {
      // Dedupe on the (profile, provider, kind, external_id, occurred_at)
      // unique constraint — re-syncs are idempotent.
      const res = await db
        .insert(activityItem)
        .values({ ...item, profileId: conn.profileId })
        .onConflictDoNothing()
        .returning({ id: activityItem.id });
      written += res.length;
    }

    await db
      .update(connection)
      .set({
        status: "active",
        lastSyncAt: new Date(),
        errorCount: 0,
        lastError: null,
      })
      .where(eq(connection.id, conn.id));

    return {
      connectionId: conn.id,
      provider: conn.provider,
      status: "active",
      itemsWritten: written,
    };
  } catch (err) {
    const revoked = err instanceof RevokedError;
    const message =
      err instanceof FeedNotFoundError || err instanceof RevokedError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Unknown sync error";
    const status: "revoked" | "error" = revoked ? "revoked" : "error";

    await db
      .update(connection)
      .set({
        status,
        errorCount: sql`${connection.errorCount} + 1`,
        lastError: message,
      })
      .where(eq(connection.id, conn.id));

    return {
      connectionId: conn.id,
      provider: conn.provider,
      status,
      itemsWritten: 0,
      error: message,
    };
  }
}

/** Sync every connection in the system (the cron path). */
export async function syncAllConnections(): Promise<SyncOutcome[]> {
  const db = getDb();
  const conns = await db.select().from(connection);
  const outcomes: SyncOutcome[] = [];
  for (const conn of conns as Connection[]) {
    outcomes.push(await syncConnection(conn));
  }
  return outcomes;
}

/** Sync one connection by id (the dashboard "sync now" path). */
export async function syncConnectionById(
  id: string,
): Promise<SyncOutcome | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(connection)
    .where(eq(connection.id, id))
    .limit(1);
  const conn = rows[0] as Connection | undefined;
  if (!conn) return null;
  return syncConnection(conn);
}
