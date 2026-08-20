"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { follow, profile } from "@/db/schema";
import { requireCurrentProfile } from "@/lib/auth/session";

export type FollowResult = { following: boolean; error?: string };

/**
 * Follow / unfollow another creator.
 *
 * The follower side is ALWAYS the signed-in profile derived from the session —
 * it is never taken from the client. The target is looked up by handle rather
 * than id for the same reason: a handle is already public, an id passed from
 * the browser would be an unvalidated pointer into the table.
 */
export async function toggleFollow(handle: string): Promise<FollowResult> {
  let me;
  try {
    me = await requireCurrentProfile();
  } catch {
    return { following: false, error: "NOT_AUTHENTICATED" };
  }

  const db = getDb();
  const rows = await db
    .select({ id: profile.id, handle: profile.handle })
    .from(profile)
    .where(eq(profile.handle, handle))
    .limit(1);
  const target = rows[0];
  if (!target) return { following: false, error: "Профайл олдсонгүй." };
  if (target.id === me.id) {
    return { following: false, error: "Өөрийгөө дагах боломжгүй." };
  }

  const existing = await db
    .select({ id: follow.id })
    .from(follow)
    .where(
      and(
        eq(follow.followerProfileId, me.id),
        eq(follow.followingProfileId, target.id),
      ),
    )
    .limit(1);

  let following: boolean;
  if (existing[0]) {
    await db.delete(follow).where(eq(follow.id, existing[0].id));
    following = false;
  } else {
    // onConflictDoNothing covers the double-tap race: two submits in flight
    // would both miss the SELECT above and the second INSERT would hit the
    // (follower, following) unique index.
    await db
      .insert(follow)
      .values({ followerProfileId: me.id, followingProfileId: target.id })
      .onConflictDoNothing();
    following = true;
  }

  revalidatePath(`/${target.handle}`);
  revalidatePath("/notifications");
  return { following };
}
