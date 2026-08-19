"use server";

import crypto from "node:crypto";
import { and, asc, desc, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { getDb } from "@/db";
import { campaign, campaignAssignment, profile } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { rehostImage } from "@/lib/storage/images";
import { PICK_IMAGE_BUCKET } from "@/lib/storage/images";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * Campaign management. Every entry point opens with requireAdmin(): server
 * actions are POST endpoints, so the middleware guard on /admin is not enough
 * on its own.
 */

export type CampaignRow = {
  id: string;
  title: string;
  bannerImageUrl: string | null;
  destinationUrl: string | null;
  advertiserLabel: string | null;
  isActive: boolean;
  assignedCount: number;
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

/**
 * Banner upload: same Storage bucket and WebP pipeline as avatars/picks, kept
 * at the card's 382x305 aspect so uploads can't distort the shelf.
 *
 * Stored at 1146x915 — 3x the rendered card. Anything less is visibly soft on
 * a DPR-3 phone, which is where these are actually looked at.
 */
export async function uploadCampaignBanner(
  formData: FormData,
): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Зураг сонгоно уу." };
  if (file.size > 8 * 1024 * 1024) return { error: "Зураг хэтэрхий том (8MB-аас бага)." };

  try {
    const input = Buffer.from(await file.arrayBuffer());

    // The in-browser cropper already emits exactly 1146x915 WebP, framed by the
    // admin. Re-encoding that costs ~170ms of function time (the entropy-based
    // "attention" crop is the expensive part) and can only lose quality, so
    // pass it straight through. Anything else — a pasted URL, a different size,
    // a JPEG — still goes through the full pipeline.
    const meta = await sharp(input).metadata();
    const alreadyExact =
      meta.format === "webp" && meta.width === 1146 && meta.height === 915;

    const webp = alreadyExact
      ? input
      : await sharp(input)
          .rotate()
          .resize(1146, 915, { fit: "cover", position: "attention", withoutEnlargement: false, kernel: "lanczos3" })
          .webp({ quality: 92 })
          .toBuffer();

    const path = `campaigns/${crypto.randomUUID()}.webp`;
    const admin = getSupabaseAdmin();
    const { error } = await admin.storage
      .from(PICK_IMAGE_BUCKET)
      .upload(path, webp, { contentType: "image/webp", upsert: false });
    if (error) return { error: "Байршуулахад алдаа гарлаа." };

    const { data: pub } = admin.storage.from(PICK_IMAGE_BUCKET).getPublicUrl(path);
    return { url: pub.publicUrl };
  } catch {
    return { error: "Зургийг боловсруулж чадсангүй." };
  }
}

export type CampaignInput = {
  title: string;
  bannerImageUrl?: string | null;
  destinationUrl?: string | null;
  advertiserLabel?: string | null;
};

export async function createCampaign(input: CampaignInput): Promise<string> {
  const admin = await requireAdmin();
  const title = input.title.trim();
  if (!title) throw new Error("Гарчиг заавал.");
  const db = getDb();

  // A pasted banner URL is re-hosted rather than hotlinked, so an advertiser
  // swapping or pulling the asset can't change what our pages render.
  let banner = input.bannerImageUrl?.trim() || null;
  if (banner && !banner.includes(".supabase.co")) {
    const rehosted = await rehostImage(banner, "campaigns");
    if (rehosted) banner = rehosted.url;
  }

  const rows = await db
    .insert(campaign)
    .values({
      title,
      bannerImageUrl: banner,
      destinationUrl: asHttpUrl(input.destinationUrl),
      advertiserLabel: input.advertiserLabel?.trim() || null,
      createdBy: admin.id,
    })
    .returning({ id: campaign.id });

  revalidatePath("/admin/campaigns");
  return rows[0]!.id;
}

export async function updateCampaign(campaignId: string, input: CampaignInput) {
  await requireAdmin();
  const title = input.title.trim();
  if (!title) throw new Error("Гарчиг заавал.");
  const db = getDb();

  let banner = input.bannerImageUrl?.trim() || null;
  if (banner && !banner.includes(".supabase.co")) {
    const rehosted = await rehostImage(banner, "campaigns");
    if (rehosted) banner = rehosted.url;
  }

  await db
    .update(campaign)
    .set({
      title,
      bannerImageUrl: banner,
      destinationUrl: asHttpUrl(input.destinationUrl),
      advertiserLabel: input.advertiserLabel?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(campaign.id, campaignId));

  await revalidateCampaignTargets(campaignId);
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

/** Pause/resume everywhere at once, without losing the placements. */
export async function setCampaignActive(campaignId: string, isActive: boolean) {
  await requireAdmin();
  await getDb()
    .update(campaign)
    .set({ isActive, updatedAt: new Date() })
    .where(eq(campaign.id, campaignId));
  await revalidateCampaignTargets(campaignId);
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

export async function deleteCampaign(campaignId: string) {
  await requireAdmin();
  // Assignments cascade; capture the affected profiles before they vanish.
  await revalidateCampaignTargets(campaignId);
  await getDb().delete(campaign).where(eq(campaign.id, campaignId));
  revalidatePath("/admin/campaigns");
}

/**
 * Bulk assign — the common case is one banner across many creators at once,
 * so this takes a list. Re-assigning an existing pair reactivates it instead
 * of erroring on the unique constraint.
 */
export async function assignCampaign(campaignId: string, profileIds: string[]) {
  const admin = await requireAdmin();
  if (profileIds.length === 0) return;
  const db = getDb();

  for (const profileId of profileIds) {
    const posRows = await db
      .select({ maxPos: max(campaignAssignment.position) })
      .from(campaignAssignment)
      .where(eq(campaignAssignment.profileId, profileId));

    await db
      .insert(campaignAssignment)
      .values({
        campaignId,
        profileId,
        position: (posRows[0]?.maxPos ?? -1) + 1,
        assignedBy: admin.id,
      })
      .onConflictDoUpdate({
        target: [campaignAssignment.campaignId, campaignAssignment.profileId],
        set: { isActive: true, assignedBy: admin.id },
      });
  }

  await revalidateCampaignTargets(campaignId);
  revalidatePath(`/admin/campaigns/${campaignId}`);
}

export async function unassignCampaign(campaignId: string, profileId: string) {
  await requireAdmin();
  const db = getDb();
  await db
    .delete(campaignAssignment)
    .where(
      and(
        eq(campaignAssignment.campaignId, campaignId),
        eq(campaignAssignment.profileId, profileId),
      ),
    );
  await revalidateProfile(profileId);
  revalidatePath(`/admin/campaigns/${campaignId}`);
  revalidatePath(`/admin/${profileId}`);
}

/** Reorder one creator's shelf: ordered assignment ids → positions. */
export async function reorderProfileCampaigns(
  profileId: string,
  orderedAssignmentIds: string[],
) {
  await requireAdmin();
  const db = getDb();
  await Promise.all(
    orderedAssignmentIds.map((id, i) =>
      db
        .update(campaignAssignment)
        .set({ position: i })
        .where(
          and(
            eq(campaignAssignment.id, id),
            eq(campaignAssignment.profileId, profileId),
          ),
        ),
    ),
  );
  await revalidateProfile(profileId);
  revalidatePath(`/admin/${profileId}`);
}

// --- reads ----------------------------------------------------------------

export async function listCampaigns(): Promise<CampaignRow[]> {
  await requireAdmin();
  const db = getDb();
  const rows = await db.select().from(campaign).orderBy(desc(campaign.createdAt));
  const counts = await db
    .select({ campaignId: campaignAssignment.campaignId, id: campaignAssignment.id })
    .from(campaignAssignment)
    .where(eq(campaignAssignment.isActive, true));

  const byCampaign = new Map<string, number>();
  for (const c of counts) {
    byCampaign.set(c.campaignId, (byCampaign.get(c.campaignId) ?? 0) + 1);
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    bannerImageUrl: r.bannerImageUrl,
    destinationUrl: r.destinationUrl,
    advertiserLabel: r.advertiserLabel,
    isActive: r.isActive,
    assignedCount: byCampaign.get(r.id) ?? 0,
  }));
}

export type AssignedCreator = {
  assignmentId: string;
  profileId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  position: number;
};

export async function listCampaignCreators(
  campaignId: string,
): Promise<AssignedCreator[]> {
  await requireAdmin();
  return getDb()
    .select({
      assignmentId: campaignAssignment.id,
      profileId: profile.id,
      handle: profile.handle,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      position: campaignAssignment.position,
    })
    .from(campaignAssignment)
    .innerJoin(profile, eq(profile.id, campaignAssignment.profileId))
    .where(
      and(
        eq(campaignAssignment.campaignId, campaignId),
        eq(campaignAssignment.isActive, true),
      ),
    )
    .orderBy(asc(profile.handle));
}

// --- helpers --------------------------------------------------------------

/** Drop the cached public page for every profile a campaign runs on. */
async function revalidateCampaignTargets(campaignId: string) {
  const rows = await getDb()
    .select({ handle: profile.handle })
    .from(campaignAssignment)
    .innerJoin(profile, eq(profile.id, campaignAssignment.profileId))
    .where(eq(campaignAssignment.campaignId, campaignId));
  for (const r of rows) revalidatePath(`/${r.handle}`);
}

async function revalidateProfile(profileId: string) {
  const rows = await getDb()
    .select({ handle: profile.handle })
    .from(profile)
    .where(eq(profile.id, profileId))
    .limit(1);
  if (rows[0]) revalidatePath(`/${rows[0].handle}`);
}
