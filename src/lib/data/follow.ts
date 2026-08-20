import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { follow } from "@/db/schema";
import { getCurrentProfile } from "@/lib/auth/session";
import { env } from "@/lib/env";

/**
 * Does the signed-in creator follow this profile? False when signed out.
 *
 * A plain data read, deliberately NOT in src/lib/actions — everything exported
 * from a "use server" module becomes a callable POST endpoint, and a read this
 * page already performs server-side has no business being one.
 */
export async function isFollowing(targetProfileId: string): Promise<boolean> {
  if (!env.hasDatabase) return false;
  const me = await getCurrentProfile();
  if (!me || me.id === targetProfileId) return false;
  const rows = await getDb()
    .select({ id: follow.id })
    .from(follow)
    .where(
      and(
        eq(follow.followerProfileId, me.id),
        eq(follow.followingProfileId, targetProfileId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** How many creators follow this profile. */
export async function getFollowerCount(profileId: string): Promise<number> {
  if (!env.hasDatabase) return 0;
  const rows = await getDb()
    .select({ id: follow.id })
    .from(follow)
    .where(eq(follow.followingProfileId, profileId));
  return rows.length;
}
