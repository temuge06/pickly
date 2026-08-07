"use server";

import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { usernameToEmail } from "@/lib/auth/username";
import { handleSchema, passwordSchema } from "@/lib/validation";

export type SignUpResult = { ok: true } | { error: string };
export type ResetResult = { ok: true } | { error: string };

/**
 * DEMO password reset — no email, no token, no verification. The user supplies
 * a username (or email) + a new password and we set it directly via the
 * service-role admin API. This is intentionally NOT secure (anyone who knows a
 * username can change that account's password) and exists only for this demo.
 */
export async function resetPasswordDemo(
  username: string,
  password: string,
): Promise<ResetResult> {
  const p = passwordSchema.safeParse(password);
  if (!p.success) return { error: p.error.issues[0]?.message ?? "Нууц үг буруу." };

  const email = usernameToEmail(username);

  // Look up the auth user id by (synthetic or real) email.
  const rows = (await getDb().execute(
    sql`select id from auth.users where lower(email) = ${email} limit 1`,
  )) as unknown as Array<{ id: string }>;
  const userId = rows[0]?.id;
  if (!userId) return { error: "Ийм хэрэглэгч олдсонгүй." };

  const admin = getSupabaseAdmin();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: p.data,
  });
  if (error) return { error: "Шинэчлэхэд алдаа гарлаа. Дахин оролдоно уу." };

  return { ok: true };
}

/**
 * Instant sign-up with a USERNAME + password — no email involved. The username
 * doubles as the public handle and is mapped to a synthetic auth email. The
 * account is created already confirmed, so the user can sign in immediately.
 */
export async function signUpInstant(
  username: string,
  password: string,
): Promise<SignUpResult> {
  const u = handleSchema.safeParse(username);
  if (!u.success) {
    return { error: u.error.issues[0]?.message ?? "Хэрэглэгчийн нэр буруу." };
  }
  const p = passwordSchema.safeParse(password);
  if (!p.success) return { error: p.error.issues[0]?.message ?? "Нууц үг буруу." };

  // The username becomes the handle — reject if the handle is already taken.
  const taken = (await getDb().execute(
    sql`select 1 from profile where lower(handle) = ${u.data} limit 1`,
  )) as unknown as Array<unknown>;
  if (taken.length > 0) {
    return { error: "Энэ нэр аль хэдийн авагдсан байна." };
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.auth.admin.createUser({
    email: usernameToEmail(u.data),
    password: p.data,
    email_confirm: true,
    user_metadata: { username: u.data },
  });

  if (error) {
    const msg = (error.message ?? "").toLowerCase();
    if (
      msg.includes("already") ||
      msg.includes("exists") ||
      msg.includes("registered")
    ) {
      return { error: "Энэ нэр аль хэдийн авагдсан байна." };
    }
    return { error: "Бүртгэхэд алдаа гарлаа. Дахин оролдоно уу." };
  }

  return { ok: true };
}
