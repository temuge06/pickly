"use server";

import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { profile } from "@/db/schema";
import { getSessionUser } from "@/lib/auth/session";
import { displayNameSchema, handleSchema } from "@/lib/validation";

export type OnboardingResult = { error: string } | never;

/**
 * Creates the signed-in user's profile. Ownership is anchored to the session's
 * auth.uid() — the client never supplies user_id. Uniqueness of handle is
 * checked in-app AND enforced by the DB unique index (race-safe).
 */
export async function completeOnboarding(
  _prev: OnboardingResult | null,
  formData: FormData,
): Promise<OnboardingResult | null> {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");

  // The handle is the username chosen at sign-up, encoded in the auth email
  // (username@pickly.local). It is never taken from the client.
  const username = (user.email ?? "").split("@")[0];
  const handleParsed = handleSchema.safeParse(username);
  if (!handleParsed.success) {
    return { error: handleParsed.error.issues[0]?.message ?? "Буруу нэр." };
  }
  const nameParsed = displayNameSchema.safeParse(formData.get("displayName"));
  if (!nameParsed.success) {
    return { error: nameParsed.error.issues[0]?.message ?? "Нэрээ шалгана уу." };
  }

  const handle = handleParsed.data;
  const displayName = nameParsed.data;
  const avatarUrl =
    (formData.get("avatarUrl") as string | null)?.trim() || null;

  const db = getDb();

  // One profile per user — if they somehow already have one, go home.
  const existing = await db
    .select({ id: profile.id })
    .from(profile)
    .where(eq(profile.userId, user.id))
    .limit(1);
  if (existing.length > 0) redirect("/dashboard");

  // Case-insensitive availability check (handle is citext).
  const taken = await db
    .select({ id: profile.id })
    .from(profile)
    .where(sql`lower(${profile.handle}) = ${handle}`)
    .limit(1);
  if (taken.length > 0) {
    return { error: "Энэ нэр аль хэдийн авагдсан байна." };
  }

  try {
    await db.insert(profile).values({
      userId: user.id,
      handle,
      displayName,
      avatarUrl,
    });
  } catch {
    // Unique index caught a race — surface as a friendly retry.
    return { error: "Энэ нэр аль хэдийн авагдсан байна." };
  }

  redirect("/dashboard");
}
