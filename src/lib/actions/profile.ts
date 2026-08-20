"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { profile } from "@/db/schema";
import { requireCurrentProfile } from "@/lib/auth/session";
import { SOCIAL_KEYS, isSocialKey, normalizeSocial } from "@/lib/socials";
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
  if (!bio.success) return { error: "Bio хэтэрхий урт байна." };

  // Every key in the shared catalogue, not a hardcoded trio — the editor lets
  // a creator add any of them. Values are normalised to a real URL here rather
  // than in the browser, so a handle typed as "@sarnai" still opens on the
  // public page, and an empty field drops its key instead of storing "".
  //
  // Anything stored under a key the catalogue does not cover is carried over
  // untouched: the form has no field for it, so treating "absent from the
  // FormData" as "delete it" would silently drop a link the creator never
  // touched. The public header renders those keys with the fallback glyph.
  const existing = (me.socials ?? {}) as Record<string, string>;
  const socials: Record<string, string> = {};
  for (const [key, value] of Object.entries(existing)) {
    if (!isSocialKey(key) && value) socials[key] = value;
  }
  for (const key of SOCIAL_KEYS) {
    const raw = formData.get(`social_${key}`);
    if (typeof raw !== "string") continue;
    const url = normalizeSocial(key, raw);
    if (url) socials[key] = url;
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
