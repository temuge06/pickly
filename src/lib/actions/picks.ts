"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { pick } from "@/db/schema";
import { requireCurrentProfile } from "@/lib/auth/session";
import { extractProduct } from "@/lib/extract/product";
import { rehostImage } from "@/lib/storage/images";

type PickStatus = (typeof pick.$inferSelect)["status"];
const STATUSES: PickStatus[] = [
  "testing",
  "recommend",
  "repurchased",
  "wont_rebuy",
];

export type PickPreview = {
  title: string | null;
  brand: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  sourceUrl: string;
  confident: boolean;
  failureReason: "js_rendered" | "blocked" | "fetch_failed" | null;
};

/**
 * Step 1 of add-a-pick: paste a URL, get a pre-filled preview. Never blocks the
 * creator — a failed extract returns an (almost) empty preview with the URL
 * kept, so the form can be filled by hand. The manual path still ends in a
 * pick.
 */
export async function extractPickPreview(url: string): Promise<PickPreview> {
  await requireCurrentProfile();
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

export type CreatePickInput = {
  title: string;
  brand?: string | null;
  imageUrl?: string | null;
  priceMnt?: number | null;
  rawPrice?: number | null;
  rawCurrency?: string | null;
  note?: string | null;
  status: string;
  outboundUrl?: string | null;
  sourceUrl?: string | null;
  collectionId?: string | null;
};

/**
 * Step 2: create the pick. Image is re-hosted to Supabase Storage (WebP) rather
 * than hotlinked; if re-hosting fails the pick still saves with no image.
 * Price is stored as MNT bigint; a non-MNT source amount is preserved verbatim
 * in meta and never auto-converted.
 */
export async function createPick(input: CreatePickInput) {
  const profile = await requireCurrentProfile();
  const db = getDb();

  const title = input.title.trim();
  if (!title) throw new Error("Нэр заавал.");

  const status: PickStatus = STATUSES.includes(input.status as PickStatus)
    ? (input.status as PickStatus)
    : "testing";

  // Re-host the extracted image so we don't hotlink a CDN that may block or rot.
  let imageUrl = input.imageUrl ?? null;
  if (imageUrl) {
    const rehosted = await rehostImage(imageUrl, profile.id);
    if (rehosted) imageUrl = rehosted.url;
  }

  // Collection must belong to this creator.
  const collectionId =
    input.collectionId && input.collectionId.length > 0
      ? input.collectionId
      : null;

  // source_url = what was pasted; outbound_url = where card taps go (the seam
  // where link-wrapping lands later). Both must be real http(s) URLs or null.
  const sourceUrl = asHttpUrl(input.sourceUrl);
  const outboundUrl = asHttpUrl(input.outboundUrl) ?? sourceUrl;

  const meta: Record<string, unknown> = {};
  if (input.rawCurrency && input.rawCurrency.toUpperCase() !== "MNT") {
    meta.rawPrice = input.rawPrice ?? null;
    meta.rawCurrency = input.rawCurrency.toUpperCase();
  }

  const nextPos = await nextPickPosition(profile.id, collectionId);

  await db.insert(pick).values({
    profileId: profile.id,
    collectionId,
    title,
    brand: input.brand?.trim() || null,
    imageUrl,
    priceMnt:
      input.priceMnt != null && Number.isFinite(input.priceMnt)
        ? Math.round(input.priceMnt)
        : null,
    note: input.note?.trim() || null,
    status,
    outboundUrl,
    sourceUrl,
    position: nextPos,
    meta,
  });

  revalidatePath("/dashboard");
}

export async function updatePickStatus(pickId: string, status: string) {
  const profile = await requireCurrentProfile();
  if (!STATUSES.includes(status as PickStatus)) throw new Error("Bad status.");
  const db = getDb();
  await db
    .update(pick)
    .set({ status: status as PickStatus, statusUpdatedAt: new Date() })
    .where(and(eq(pick.id, pickId), eq(pick.profileId, profile.id)));
  revalidatePath("/dashboard");
}

export async function updatePickNote(pickId: string, note: string) {
  const profile = await requireCurrentProfile();
  const db = getDb();
  await db
    .update(pick)
    .set({ note: note.trim() || null })
    .where(and(eq(pick.id, pickId), eq(pick.profileId, profile.id)));
  revalidatePath("/dashboard");
}

export async function setPickCollection(
  pickId: string,
  collectionId: string | null,
) {
  const profile = await requireCurrentProfile();
  const db = getDb();
  await db
    .update(pick)
    .set({ collectionId })
    .where(and(eq(pick.id, pickId), eq(pick.profileId, profile.id)));
  revalidatePath("/dashboard");
}

export async function deletePick(pickId: string) {
  const profile = await requireCurrentProfile();
  const db = getDb();
  await db
    .delete(pick)
    .where(and(eq(pick.id, pickId), eq(pick.profileId, profile.id)));
  revalidatePath("/dashboard");
}

/** Trimmed http(s) URL or null — anything else (javascript:, data:, garbage)
 * is dropped rather than stored. */
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

async function nextPickPosition(
  profileId: string,
  collectionId: string | null,
): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ maxPos: max(pick.position) })
    .from(pick)
    .where(
      collectionId
        ? and(eq(pick.profileId, profileId), eq(pick.collectionId, collectionId))
        : eq(pick.profileId, profileId),
    );
  return (rows[0]?.maxPos ?? -1) + 1;
}
