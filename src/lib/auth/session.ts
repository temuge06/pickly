import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { profile } from "@/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SessionUser = { id: string; email: string | null };

/** The authenticated Supabase user, or null. Auth source of truth. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return { id: user.id, email: user.email ?? null };
}

/**
 * The signed-in creator's own profile row, derived server-side from the
 * session's auth.uid(). This is the ownership anchor: every dashboard read and
 * write scopes by the returned `profile.id`, so client-supplied profile_id is
 * never trusted. Returns null if not signed in or onboarding isn't done.
 */
export async function getCurrentProfile() {
  const user = await getSessionUser();
  if (!user) return null;
  const db = getDb();
  const rows = await db
    .select()
    .from(profile)
    .where(eq(profile.userId, user.id))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Same, but throws when absent — for server actions that must run as an
 * onboarded creator. Callers catch and surface a friendly error.
 */
export async function requireCurrentProfile() {
  const p = await getCurrentProfile();
  if (!p) throw new Error("NOT_AUTHENTICATED");
  return p;
}
