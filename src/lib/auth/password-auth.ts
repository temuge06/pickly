"use server";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { emailSchema, passwordSchema } from "@/lib/validation";

export type SignUpResult = { ok: true } | { error: string };

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
