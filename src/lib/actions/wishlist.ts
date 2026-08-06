"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { wishlistItem } from "@/db/schema";
import { requireCurrentProfile } from "@/lib/auth/session";
import { rehostImage } from "@/lib/storage/images";

export type CreateWishlistInput = {
  title: string;
  imageUrl?: string | null;
  priceMnt?: number | null;
  rawPrice?: number | null;
  rawCurrency?: string | null;
  url?: string | null;
  note?: string | null;
};

/**
 * Add a wishlist item (something the creator WANTS but doesn't own yet).
 * Same paste-a-URL extraction as picks (the client runs extractPickPreview
 * first). Image is re-hosted to Supabase; non-MNT prices are kept raw in meta.
 */
export async function createWishlistItem(input: CreateWishlistInput) {
  const profile = await requireCurrentProfile();
  const db = getDb();

  const title = input.title.trim();
  if (!title) throw new Error("Нэр заавал.");

  let imageUrl = input.imageUrl ?? null;
  if (imageUrl) {
    const rehosted = await rehostImage(imageUrl, profile.id);
    if (rehosted) imageUrl = rehosted.url;
  }

  const meta: Record<string, unknown> = {};
  if (input.rawCurrency && input.rawCurrency.toUpperCase() !== "MNT") {
    meta.rawPrice = input.rawPrice ?? null;
    meta.rawCurrency = input.rawCurrency.toUpperCase();
  }

  const posRows = await db
    .select({ maxPos: max(wishlistItem.position) })
    .from(wishlistItem)
    .where(eq(wishlistItem.profileId, profile.id));
  const nextPos = (posRows[0]?.maxPos ?? -1) + 1;

  await db.insert(wishlistItem).values({
    profileId: profile.id,
    title,
    imageUrl,
    priceMnt:
      input.priceMnt != null && Number.isFinite(input.priceMnt)
        ? Math.round(input.priceMnt)
        : null,
    url: asHttpUrl(input.url),
    note: input.note?.trim() || null,
    meta,
    position: nextPos,
  });

  revalidatePath("/dashboard");
}

export async function deleteWishlistItem(id: string) {
  const profile = await requireCurrentProfile();
  const db = getDb();
  await db
    .delete(wishlistItem)
    .where(and(eq(wishlistItem.id, id), eq(wishlistItem.profileId, profile.id)));
  revalidatePath("/dashboard");
}

export async function updateWishlistNote(id: string, note: string) {
  const profile = await requireCurrentProfile();
  const db = getDb();
  await db
    .update(wishlistItem)
    .set({ note: note.trim() || null })
    .where(and(eq(wishlistItem.id, id), eq(wishlistItem.profileId, profile.id)));
  revalidatePath("/dashboard");
}

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
