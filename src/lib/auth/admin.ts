import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { adminUser } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";

export type AdminUser = typeof adminUser.$inferSelect;

/**
 * The staff record for the signed-in account, or null.
 *
 * Membership in `admin_user` is the whole authorization boundary for /admin —
 * there is deliberately no "grant admin" code path anywhere in the app, so a
 * row can only appear via SQL run by an operator. Everything under /admin
 * derives its right to write to another creator's data from this call, never
 * from a client-supplied flag.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const db = getDb();
  const rows = await db
    .select()
    .from(adminUser)
    .where(eq(adminUser.authUserId, user.id))
    .limit(1);
  return rows[0] ?? null;
}

/** Boolean form, for render-time branching. */
export async function isAdmin(): Promise<boolean> {
  return (await getAdminUser()) !== null;
}

/**
 * Same as getAdminUser but throws for non-staff — the guard every /admin
 * server action opens with, so an action stays protected even if it is invoked
 * directly (server actions are POST endpoints; middleware alone is not enough).
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();
  if (!admin) throw new Error("FORBIDDEN");
  return admin;
}
