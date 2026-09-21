"use server";

import crypto from "node:crypto";
import { and, asc, eq, isNull, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { getDb } from "@/db";
import { profile, promoCode } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { PICK_IMAGE_BUCKET, rehostImage } from "@/lib/storage/images";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/** Promo artwork is the ticket's left panel: 114x162, stored at 3x. */
const OUT_W = 342;
const OUT_H = 486;

export type PromoRow = {
  id: string;
  headline: string;
  description: string | null;
  code: string;
  url: string | null;
  imageUrl: string | null;
  expiresAt: Date | null;
  isActive: boolean;
  usedAt: Date | null;
  position: number;
};

export type PromoInput = {
  headline: string;
  description?: string | null;
  code: string;
  url?: string | null;
  imageUrl?: string | null;
  /** "YYYY-MM-DD" from a date input, or empty for no expiry. */
  expiresAt?: string | null;
};

function asHttpUrl(raw: string | null | undefined): string | null {
  const v = raw?.trim();
  if (!v) return null;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function asDate(raw: string | null | undefined): Date | null {
  const v = raw?.trim();
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function uploadPromoImage(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Зураг сонгоно уу." };
  if (file.size > 8 * 1024 * 1024) return { error: "Зураг хэтэрхий том (8MB-аас бага)." };

  try {
    const input = Buffer.from(await file.arrayBuffer());
    // The cropper already frames to exactly this size; re-encoding it only
    // costs function time and quality, so pass it straight through.
    const meta = await sharp(input).metadata();
    const exact =
      meta.format === "webp" && meta.width === OUT_W && meta.height === OUT_H;
    const webp = exact
      ? input
      : await sharp(input)
          .rotate()
          .resize(OUT_W, OUT_H, { fit: "cover", position: "attention", kernel: "lanczos3" })
          .webp({ quality: 92 })
          .toBuffer();

    const path = `promos/${crypto.randomUUID()}.webp`;
    const admin = getSupabaseAdmin();
    const { error } = await admin.storage
      .from(PICK_IMAGE_BUCKET)
      .upload(path, webp, { contentType: "image/webp", upsert: false, cacheControl: "31536000" });
    if (error) return { error: "Байршуулахад алдаа гарлаа." };

    const { data: pub } = admin.storage.from(PICK_IMAGE_BUCKET).getPublicUrl(path);
    return { url: pub.publicUrl };
  } catch {
    return { error: "Зургийг боловсруулж чадсангүй." };
  }
}

async function revalidateFor(profileId: string) {
  const rows = await getDb()
    .select({ handle: profile.handle })
    .from(profile)
    .where(eq(profile.id, profileId))
    .limit(1);
  if (rows[0]) revalidatePath(`/${rows[0].handle}`);
  revalidatePath(`/admin/${profileId}`);
}

export async function createPromo(profileId: string, input: PromoInput) {
  const admin = await requireAdmin();
  const headline = input.headline.trim();
  const code = input.code.trim();
  if (!headline) throw new Error("Гарчиг заавал.");
  if (!code) throw new Error("Промо код заавал.");
  const db = getDb();

  const target = await db
    .select({ id: profile.id })
    .from(profile)
    .where(eq(profile.id, profileId))
    .limit(1);
  if (!target[0]) throw new Error("Бүтээгч олдсонгүй.");

  let image = input.imageUrl?.trim() || null;
  if (image && !image.includes(".supabase.co")) {
    const rehosted = await rehostImage(image, "promos");
    if (rehosted) image = rehosted.url;
  }

  const posRows = await db
    .select({ maxPos: max(promoCode.position) })
    .from(promoCode)
    .where(eq(promoCode.profileId, profileId));

  await db.insert(promoCode).values({
    profileId,
    headline,
    description: input.description?.trim() || null,
    code,
    url: asHttpUrl(input.url),
    imageUrl: image,
    expiresAt: asDate(input.expiresAt),
    position: (posRows[0]?.maxPos ?? -1) + 1,
    createdBy: admin.id,
  });

  await revalidateFor(profileId);
}

export async function updatePromo(promoId: string, input: PromoInput) {
  await requireAdmin();
  const headline = input.headline.trim();
  const code = input.code.trim();
  if (!headline) throw new Error("Гарчиг заавал.");
  if (!code) throw new Error("Промо код заавал.");

  let image = input.imageUrl?.trim() || null;
  if (image && !image.includes(".supabase.co")) {
    const rehosted = await rehostImage(image, "promos");
    if (rehosted) image = rehosted.url;
  }

  const rows = await getDb()
    .update(promoCode)
    .set({
      headline,
      description: input.description?.trim() || null,
      code,
      url: asHttpUrl(input.url),
      imageUrl: image,
      expiresAt: asDate(input.expiresAt),
      updatedAt: new Date(),
    })
    .where(eq(promoCode.id, promoId))
    .returning({ profileId: promoCode.profileId });
  if (rows[0]) await revalidateFor(rows[0].profileId);
}

export async function setPromoActive(promoId: string, isActive: boolean) {
  await requireAdmin();
  const rows = await getDb()
    .update(promoCode)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(promoCode.id, promoId))
    .returning({ profileId: promoCode.profileId });
  if (rows[0]) await revalidateFor(rows[0].profileId);
}

export async function deletePromo(promoId: string) {
  await requireAdmin();
  const rows = await getDb()
    .delete(promoCode)
    .where(eq(promoCode.id, promoId))
    .returning({ profileId: promoCode.profileId });
  if (rows[0]) await revalidateFor(rows[0].profileId);
}

export async function reorderPromos(profileId: string, orderedIds: string[]) {
  await requireAdmin();
  const db = getDb();
  await Promise.all(
    orderedIds.map((id, i) =>
      db
        .update(promoCode)
        .set({ position: i })
        .where(and(eq(promoCode.id, id), eq(promoCode.profileId, profileId))),
    ),
  );
  await revalidateFor(profileId);
}

export async function listPromos(profileId: string): Promise<PromoRow[]> {
  await requireAdmin();
  return getDb()
    .select({
      id: promoCode.id,
      headline: promoCode.headline,
      description: promoCode.description,
      code: promoCode.code,
      url: promoCode.url,
      imageUrl: promoCode.imageUrl,
      expiresAt: promoCode.expiresAt,
      isActive: promoCode.isActive,
      usedAt: promoCode.usedAt,
      position: promoCode.position,
    })
    .from(promoCode)
    .where(eq(promoCode.profileId, profileId))
    .orderBy(asc(promoCode.position), asc(promoCode.createdAt));
}

/**
 * Claim a promo code — PUBLIC, no auth: anyone viewing the profile, the owner
 * included, can be the one who takes it. The code is single-use across the
 * whole audience, so the guard is in the UPDATE itself (`used_at IS NULL`):
 * two simultaneous taps race on the row lock and exactly one wins. Returns
 * whether THIS call was the one that claimed it, so a viewer whose page was
 * stale can grey the ticket out instead of treating it as theirs.
 */
export async function claimPromo(promoId: string): Promise<{ claimed: boolean }> {
  if (typeof promoId !== "string" || !/^[0-9a-f-]{36}$/i.test(promoId)) {
    return { claimed: false };
  }
  const rows = await getDb()
    .update(promoCode)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(promoCode.id, promoId),
        eq(promoCode.isActive, true),
        isNull(promoCode.usedAt),
      ),
    )
    .returning({ id: promoCode.id });
  // No revalidatePath: the profile page is force-dynamic, so every later load
  // reads the row fresh — and revalidating here would push a new RSC payload
  // into the tapper's page and grey the ticket out mid-"Copied" feedback.
  return { claimed: rows.length > 0 };
}

/** Staff: put a claimed code back on the shelf as live. */
export async function resetPromoUsed(promoId: string) {
  await requireAdmin();
  const rows = await getDb()
    .update(promoCode)
    .set({ usedAt: null, updatedAt: new Date() })
    .where(eq(promoCode.id, promoId))
    .returning({ profileId: promoCode.profileId });
  if (rows[0]) await revalidateFor(rows[0].profileId);
}
