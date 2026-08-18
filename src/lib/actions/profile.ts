"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { profile } from "@/db/schema";
import { requireCurrentProfile } from "@/lib/auth/session";
import { THEMES, type ThemeKey } from "@/lib/themes";
import { bioSchema, displayNameSchema } from "@/lib/validation";

export type ProfileUpdateResult = { error?: string; ok?: boolean };

export async function updateProfile(
  _prev: ProfileUpdateResult | null,
  formData: FormData,
): Promise<ProfileUpdateResult> {
  const me = await requireCurrentProfile();

  const name = displayNameSchema.safeParse(formData.get("displayName"));
  if (!name.success) {
    return { error: name.error.issues[0]?.message ?? "Нэр буруу." };
  }
  const bio = bioSchema.safeParse(formData.get("bio") ?? "");
  if (!bio.success) return { error: "Танилцуулга хэтэрхий урт." };

  const socials: Record<string, string> = {};
  for (const key of ["instagram", "tiktok", "youtube"]) {
    const val = (formData.get(key) as string | null)?.trim();
    if (val) socials[key] = val;
  }

  const db = getDb();
  // NOTE: avatar_url is intentionally NOT set here. The avatar is managed by
  // its own flow (uploadAvatar / removeAvatar); including it in this update
  // would wipe an uploaded picture whenever name/bio/socials are saved, since
  // this form has no avatar field.
  await db
    .update(profile)
    .set({
      displayName: name.data,
      bio: bio.data?.trim() || null,
      accentColor:
        (formData.get("accentColor") as string | null)?.trim() || null,
      socials,
    })
    .where(eq(profile.id, me.id));

  revalidatePath("/dashboard");
  revalidatePath(`/${me.handle}`);
  return { ok: true };
}

/**
 * Set the creator's public-profile palette. Theme stays creator-controlled
 * (unlike picks, which are admin-only) — it's presentation of their own page,
 * not catalogue data. Applies instantly: toggle = save, no separate submit.
 */
export async function setProfileTheme(theme: string) {
  const me = await requireCurrentProfile();
  if (!THEMES.some((t) => t.key === theme)) throw new Error("Тема буруу.");
  const db = getDb();
  await db
    .update(profile)
    .set({ theme: theme as ThemeKey })
    .where(eq(profile.id, me.id));
  revalidatePath("/dashboard");
  revalidatePath(`/${me.handle}`);
}
