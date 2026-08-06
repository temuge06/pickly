"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { getDb } from "@/db";
import { profile } from "@/db/schema";
import { getSessionUser, requireCurrentProfile } from "@/lib/auth/session";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { PICK_IMAGE_BUCKET } from "@/lib/storage/images";

export type AvatarResult = { url?: string; error?: string };

/** Square + WebP-encode a picked image file to 400×400. */
async function toAvatarWebp(file: File): Promise<Buffer> {
  const input = Buffer.from(await file.arrayBuffer());
  return sharp(input)
    .rotate()
    .resize(400, 400, { fit: "cover", position: "attention" })
    .webp({ quality: 85 })
    .toBuffer();
}

/**
 * Uploads an avatar during onboarding, before the profile row exists. Keyed by
 * the session user id, it stores the image and returns its URL WITHOUT touching
 * any profile row — the onboarding form passes the URL into completeOnboarding.
 */
export async function uploadOnboardingAvatar(
  formData: FormData,
): Promise<AvatarResult> {
  const user = await getSessionUser();
  if (!user) return { error: "Нэвтрээгүй байна." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Зураг сонгоно уу." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { error: "Зураг хэтэрхий том байна (8MB-аас бага)." };
  }

  try {
    const webp = await toAvatarWebp(file);
    const path = `avatars/${user.id}/${crypto.randomUUID()}.webp`;
    const admin = getSupabaseAdmin();
    const { error } = await admin.storage
      .from(PICK_IMAGE_BUCKET)
      .upload(path, webp, { contentType: "image/webp", upsert: false });
    if (error) return { error: "Байршуулахад алдаа гарлаа." };

    const { data: pub } = admin.storage
      .from(PICK_IMAGE_BUCKET)
      .getPublicUrl(path);
    return { url: pub.publicUrl };
  } catch {
    return { error: "Зургийг боловсруулж чадсангүй." };
  }
}

/**
 * Uploads a creator's avatar: reads the picked file, squares + WebP-encodes it
 * (400×400), stores it in Supabase Storage under avatars/, and sets
 * profile.avatar_url. Scoped to the signed-in creator's own profile.
 */
export async function uploadAvatar(formData: FormData): Promise<AvatarResult> {
  const me = await requireCurrentProfile();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Зураг сонгоно уу." };
  }
  if (file.size > 8 * 1024 * 1024) {
    return { error: "Зураг хэтэрхий том байна (8MB-аас бага)." };
  }

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const webp = await sharp(input)
      .rotate()
      .resize(400, 400, { fit: "cover", position: "attention" })
      .webp({ quality: 85 })
      .toBuffer();

    const path = `avatars/${me.id}/${crypto.randomUUID()}.webp`;
    const admin = getSupabaseAdmin();
    const { error } = await admin.storage
      .from(PICK_IMAGE_BUCKET)
      .upload(path, webp, { contentType: "image/webp", upsert: false });
    if (error) return { error: "Байршуулахад алдаа гарлаа." };

    const { data: pub } = admin.storage
      .from(PICK_IMAGE_BUCKET)
      .getPublicUrl(path);

    await getDb()
      .update(profile)
      .set({ avatarUrl: pub.publicUrl })
      .where(eq(profile.id, me.id));

    revalidatePath("/dashboard");
    revalidatePath(`/${me.handle}`);
    return { url: pub.publicUrl };
  } catch {
    return { error: "Зургийг боловсруулж чадсангүй." };
  }
}

/** Remove the avatar (revert to the placeholder state). */
export async function removeAvatar(): Promise<void> {
  const me = await requireCurrentProfile();
  await getDb()
    .update(profile)
    .set({ avatarUrl: null })
    .where(eq(profile.id, me.id));
  revalidatePath("/dashboard");
  revalidatePath(`/${me.handle}`);
}
