import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { featureFlag } from "@/db/schema";
import { env } from "@/lib/env";
import { ALL_ENABLED, type FeatureFlags } from "@/lib/features";

/**
 * Resolved flags for one profile. Server-only (touches the DB).
 *
 * A missing row means ENABLED. We never backfill a row per (profile, feature),
 * so absence is the common case and must be read as "on" — only an explicit
 * `enabled = false` row hides a section. Callers use this server-side to decide
 * whether to QUERY a section's data at all, so a disabled section never reaches
 * the browser.
 */
export async function getFeatureFlags(profileId: string): Promise<FeatureFlags> {
  if (!env.hasDatabase) return { ...ALL_ENABLED };
  const db = getDb();
  const rows = await db
    .select({ feature: featureFlag.feature, enabled: featureFlag.enabled })
    .from(featureFlag)
    .where(eq(featureFlag.profileId, profileId));

  const flags = { ...ALL_ENABLED };
  for (const row of rows) flags[row.feature] = row.enabled;
  return flags;
}
