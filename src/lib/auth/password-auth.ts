"use server";

import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { emailSchema, passwordSchema } from "@/lib/validation";

export type SignUpResult = { ok: true } | { error: string };
export type ResetResult = { ok: true } | { error: string };

/**
 * DEMO password reset — no email, no token, no verification. The user supplies
 * an email + a new password and we set it directly via the service-role admin
 * API. This is intentionally NOT secure (anyone who knows an email can change
 * that account's password) and exists only because this is a demo build.
 */
export async function resetPasswordDemo(
  email: string,
  password: string,
): Promise<ResetResult> {
  const e = emailSchema.safeParse(email);
  if (!e.success) return { error: e.error.issues[0]?.message ?? "Имэйл буруу." };
  const p = passwordSchema.safeParse(password);
  if (!p.success) return { error: p.error.issues[0]?.message ?? "Нууц үг буруу." };

  // Look up the auth user id by email.
  const rows = (await getDb().execute(
    sql`select id from auth.users where lower(email) = ${e.data} limit 1`,
  )) as unknown as Array<{ id: string }>;
  const userId = rows[0]?.id;
  if (!userId) return { error: "Ийм имэйлтэй бүртгэл олдсонгүй." };

  const admin = getSupabaseAdmin();
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: p.data,
  });
  if (error) return { error: "Шинэчлэхэд алдаа гарлаа. Дахин оролдоно уу." };

  return { ok: true };
}

/**
 * Instant sign-up: creates the account already email-confirmed via the
 * service-role admin API, so there is no confirmation email and the user can
 * sign in immediately. This bypasses the Supabase project's "confirm email"
 * setting entirely — the client then calls signInWithPassword to get a session.
 */
export async function signUpInstant(
  email: string,
  password: string,
): Promise<SignUpResult> {
  const e = emailSchema.safeParse(email);
  if (!e.success) return { error: e.error.issues[0]?.message ?? "Имэйл буруу." };
  const p = passwordSchema.safeParse(password);
  if (!p.success) return { error: p.error.issues[0]?.message ?? "Нууц үг буруу." };

  const admin = getSupabaseAdmin();
  const { error } = await admin.auth.admin.createUser({
    email: e.data,
    password: p.data,
    email_confirm: true,
  });

  if (error) {
    const msg = (error.message ?? "").toLowerCase();
    if (
      msg.includes("already") ||
      msg.includes("exists") ||
      msg.includes("registered")
    ) {
      return { error: "Энэ имэйл бүртгэлтэй байна. Нэвтэрнэ үү." };
    }
    return { error: "Бүртгэхэд алдаа гарлаа. Дахин оролдоно уу." };
  }

  return { ok: true };
}
