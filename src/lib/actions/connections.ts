"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { activityItem, connection } from "@/db/schema";
import { requireCurrentProfile } from "@/lib/auth/session";
import { syncConnection } from "@/lib/sync/run";
import type { Connection } from "@/lib/sync/types";

/** Manual "sync now" for one of the creator's connections. */
export async function syncNow(connectionId: string) {
  const profile = await requireCurrentProfile();
  const db = getDb();
  const rows = await db
    .select()
    .from(connection)
    .where(
      and(eq(connection.id, connectionId), eq(connection.profileId, profile.id)),
    )
    .limit(1);
  const conn = rows[0] as Connection | undefined;
  if (!conn) throw new Error("Холболт олдсонгүй.");
  await syncConnection(conn);
  revalidatePath("/dashboard");
}

/**
 * Disconnect a connection. Deletes the tokens and marks it revoked. The creator
 * chooses whether to also clear the synced history — the public page hides a
 * revoked section either way, but keeping history means a reconnect restores it
 * instantly.
 */
export async function disconnect(
  connectionId: string,
  clearHistory: boolean,
) {
  const profile = await requireCurrentProfile();
  const db = getDb();
  const rows = await db
    .select()
    .from(connection)
    .where(
      and(eq(connection.id, connectionId), eq(connection.profileId, profile.id)),
    )
    .limit(1);
  const conn = rows[0] as Connection | undefined;
  if (!conn) throw new Error("Холболт олдсонгүй.");

  if (clearHistory) {
    await db
      .delete(activityItem)
      .where(
        and(
          eq(activityItem.profileId, profile.id),
          eq(activityItem.provider, conn.provider),
        ),
      );
  }

  await db
    .update(connection)
    .set({
      accessTokenEnc: null,
      refreshTokenEnc: null,
      expiresAt: null,
      status: "revoked",
      lastError: "Disconnected by creator.",
    })
    .where(eq(connection.id, connectionId));
  revalidatePath("/dashboard");
}
