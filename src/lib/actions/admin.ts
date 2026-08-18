"use server";

import { and, asc, eq, ilike, max, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { collection, featureFlag, pick, profile, wishlistItem } from "@/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { extractProduct } from "@/lib/extract/product";
import { FEATURES, type Feature } from "@/lib/features";
import { MAX_COLLECTIONS } from "@/lib/validation";
import { rehostImage } from "@/lib/storage/images";
import type { PickPreview } from "@/lib/extract/preview";

type PickStatus = (typeof pick.$inferSelect)["status"];
const STATUSES: PickStatus[] = [
  "testing",
  "recommend",
  "repurchased",
  "wont_rebuy",
];

/** The four destinations an admin can drop an extracted product into. */
export type AdminSection = "top_picks" | "my_picks" | "wishlist" | "not_for_me";
const SECTIONS: AdminSection[] = [
  "top_picks",
  "my_picks",
  "wishlist",
  "not_for_me",
];

export type CreatorResult = {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
};

/**
 * Creator search for the /admin picker — handle OR display name, substring,
 * case-insensitive. Staff-only; an ordinary account gets FORBIDDEN rather than
 * a roster of every creator on the platform.
 */
export async function searchCreators(query: string): Promise<CreatorResult[]> {
  await requireAdmin();
  const db = getDb();
  const q = query.trim();

  const base = db
    .select({
      id: profile.id,
      handle: profile.handle,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
    })
    .from(profile);

  const rows = q
    ? await base
        .where(
          or(
            // handle is citext, so ilike on it is redundant but harmless and
            // keeps the two branches symmetric.
            ilike(sql`${profile.handle}::text`, `%${q}%`),
            ilike(profile.displayName, `%${q}%`),
          ),
        )
        .orderBy(asc(profile.handle))
        .limit(20)
    : await base.orderBy(asc(profile.handle)).limit(20);

  return rows;
}

/**
 * Step 1 of the admin add-product flow. Deliberately the SAME pipeline as the
 * old creator-facing one (canonicalize → JSON-LD → OG → Twitter/title), called
 * unchanged — only the caller's authorization differs. Never throws on a bad
 * extract: a failed result still carries the URL so the form can be completed
 * by hand, so an admin is never blocked from adding a product.
 */
export async function adminExtractPreview(url: string): Promise<PickPreview> {
  await requireAdmin();
  const result = await extractProduct(url);
  return {
    title: result.title,
    brand: result.brand,
    imageUrl: result.imageUrl,
    price: result.price,
    currency: result.currency,
    sourceUrl: result.sourceUrl,
    confident: result.confident,
    failureReason: result.failureReason,
  };
}

export type AdminCreateProductInput = {
  /** The CREATOR being edited — never the admin's own profile. */
  profileId: string;
  section: AdminSection;
  title: string;
  brand?: string | null;
  imageUrl?: string | null;
  priceMnt?: number | null;
  rawPrice?: number | null;
  rawCurrency?: string | null;
  note?: string | null;
  sourceUrl?: string | null;
  /** Only meaningful for section "my_picks". */
  collectionId?: string | null;
  /** Only meaningful for top_picks / my_picks; not_for_me forces wont_rebuy. */
  status?: string | null;
};

/**
 * Step 2: write the product to the SELECTED creator's shelf.
 *
 * Section → storage mapping (matches how the public profile splits picks):
 *   top_picks   → pick, no collection
 *   my_picks    → pick, in a collection owned by that same creator
 *   not_for_me  → pick, status forced to wont_rebuy
 *   wishlist    → wishlist_item
 *
 * profileId comes from the admin's explicit selection, so it IS client input —
 * it is therefore validated against a real profile row here, and a supplied
 * collectionId is checked to belong to that same profile so a stray id can't
 * file a product under another creator's collection.
 */
export async function adminCreateProduct(input: AdminCreateProductInput) {
  const admin = await requireAdmin();
  const db = getDb();

  const title = input.title.trim();
  if (!title) throw new Error("Нэр заавал.");
  if (!SECTIONS.includes(input.section)) throw new Error("Хэсэг буруу.");

  const targetRows = await db
    .select({ id: profile.id, handle: profile.handle })
    .from(profile)
    .where(eq(profile.id, input.profileId))
    .limit(1);
  const target = targetRows[0];
  if (!target) throw new Error("Бүтээгч олдсонгүй.");

  // Re-host to our own storage rather than hotlinking the retailer's CDN.
  // Bucketed under the CREATOR's id — the asset belongs to them, not to the
  // staff account that happened to add it.
  let imageUrl = input.imageUrl ?? null;
  if (imageUrl) {
    const rehosted = await rehostImage(imageUrl, target.id);
    if (rehosted) imageUrl = rehosted.url;
  }

  const meta: Record<string, unknown> = {};
  if (input.rawCurrency && input.rawCurrency.toUpperCase() !== "MNT") {
    meta.rawPrice = input.rawPrice ?? null;
    meta.rawCurrency = input.rawCurrency.toUpperCase();
  }
  // Audit trail: who filed this, since the creator did not.
  meta.addedByAdminId = admin.id;

  const priceMnt =
    input.priceMnt != null && Number.isFinite(input.priceMnt)
      ? Math.round(input.priceMnt)
      : null;
  const sourceUrl = asHttpUrl(input.sourceUrl);

  if (input.section === "wishlist") {
    const posRows = await db
      .select({ maxPos: max(wishlistItem.position) })
      .from(wishlistItem)
      .where(eq(wishlistItem.profileId, target.id));

    await db.insert(wishlistItem).values({
      profileId: target.id,
      title,
      imageUrl,
      priceMnt,
      url: sourceUrl,
      note: input.note?.trim() || null,
      meta,
      position: (posRows[0]?.maxPos ?? -1) + 1,
    });
  } else {
    // "Not For Me" is not a separate table — it is a pick whose status is
    // wont_rebuy, which is how the public profile filters that section.
    const status: PickStatus =
      input.section === "not_for_me"
        ? "wont_rebuy"
        : STATUSES.includes(input.status as PickStatus)
          ? (input.status as PickStatus)
          : "testing";

    let collectionId: string | null = null;
    if (input.section === "my_picks") {
      const wanted = input.collectionId?.trim();
      if (!wanted) throw new Error("Цуглуулга сонгоно уу.");
      const owned = await db
        .select({ id: collection.id })
        .from(collection)
        .where(
          and(eq(collection.id, wanted), eq(collection.profileId, target.id)),
        )
        .limit(1);
      if (!owned[0]) throw new Error("Цуглуулга энэ бүтээгчийнх биш.");
      collectionId = owned[0].id;
    }

    const posRows = await db
      .select({ maxPos: max(pick.position) })
      .from(pick)
      .where(
        collectionId
          ? and(eq(pick.profileId, target.id), eq(pick.collectionId, collectionId))
          : eq(pick.profileId, target.id),
      );

    await db.insert(pick).values({
      profileId: target.id,
      collectionId,
      title,
      brand: input.brand?.trim() || null,
      imageUrl,
      priceMnt,
      note: input.note?.trim() || null,
      status,
      sourceUrl,
      outboundUrl: sourceUrl,
      position: (posRows[0]?.maxPos ?? -1) + 1,
      meta,
    });
  }

  revalidatePath(`/admin/${target.id}`);
  revalidatePath(`/${target.handle}`);
}

/**
 * Toggle = save: a flipped switch writes immediately, with no separate save
 * step. Upserts on (profile_id, feature) because a profile starts with NO rows
 * — the first toggle is what creates one.
 */
export async function setFeatureFlag(
  profileId: string,
  feature: string,
  enabled: boolean,
) {
  const admin = await requireAdmin();
  if (!FEATURES.includes(feature as Feature)) throw new Error("Feature буруу.");
  const db = getDb();

  const targetRows = await db
    .select({ id: profile.id, handle: profile.handle })
    .from(profile)
    .where(eq(profile.id, profileId))
    .limit(1);
  const target = targetRows[0];
  if (!target) throw new Error("Бүтээгч олдсонгүй.");

  await db
    .insert(featureFlag)
    .values({
      profileId: target.id,
      feature: feature as Feature,
      enabled,
      updatedBy: admin.id,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [featureFlag.profileId, featureFlag.feature],
      set: { enabled, updatedBy: admin.id, updatedAt: new Date() },
    });

  // A flag change re-shapes both the creator's dashboard and the public page,
  // so both have to drop their cached render.
  revalidatePath(`/admin/${target.id}`);
  revalidatePath(`/${target.handle}`);
  revalidatePath("/dashboard");
}

/** Trimmed http(s) URL or null — javascript:/data:/garbage is dropped. */
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

// ---------------------------------------------------------------------------
// Collections
//
// Creators no longer create their own collections, so this moved to /admin —
// otherwise nobody could, and Panel A's "My Picks" destination would be
// permanently unreachable for a creator starting from zero.
// ---------------------------------------------------------------------------

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `collection-${Date.now()}`;
}

export async function adminCreateCollection(profileId: string, title: string) {
  await requireAdmin();
  const t = title.trim();
  if (!t) throw new Error("Гарчиг заавал.");
  const db = getDb();

  const targetRows = await db
    .select({ id: profile.id, handle: profile.handle })
    .from(profile)
    .where(eq(profile.id, profileId))
    .limit(1);
  const target = targetRows[0];
  if (!target) throw new Error("Бүтээгч олдсонгүй.");

  const existing = await db
    .select({ slug: collection.slug, position: collection.position })
    .from(collection)
    .where(eq(collection.profileId, target.id));

  // The public My Picks section renders at most three boxes.
  if (existing.length >= MAX_COLLECTIONS) {
    throw new Error(`Хамгийн ихдээ ${MAX_COLLECTIONS} цуглуулга.`);
  }

  let slug = slugify(t);
  const taken = new Set(existing.map((e) => e.slug));
  if (taken.has(slug)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  await db.insert(collection).values({
    profileId: target.id,
    title: t,
    slug,
    position: existing.reduce((m, e) => Math.max(m, e.position), -1) + 1,
  });

  revalidatePath(`/admin/${target.id}`);
  revalidatePath(`/${target.handle}`);
}

export async function adminRenameCollection(collectionId: string, title: string) {
  await requireAdmin();
  const t = title.trim();
  if (!t) throw new Error("Гарчиг заавал.");
  const db = getDb();
  const rows = await db
    .update(collection)
    .set({ title: t })
    .where(eq(collection.id, collectionId))
    .returning({ profileId: collection.profileId });
  if (rows[0]) revalidatePath(`/admin/${rows[0].profileId}`);
}

/** Picks in the collection fall back to the ungrouped shelf (FK set null). */
export async function adminDeleteCollection(collectionId: string) {
  await requireAdmin();
  const db = getDb();
  const rows = await db
    .delete(collection)
    .where(eq(collection.id, collectionId))
    .returning({ profileId: collection.profileId });
  if (rows[0]) revalidatePath(`/admin/${rows[0].profileId}`);
}
