"use server";

import { and, eq, max } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { collection } from "@/db/schema";
import { requireCurrentProfile } from "@/lib/auth/session";

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9Ѐ-ӿ]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `collection-${Date.now()}`;
}

export async function createCollection(title: string, description?: string) {
  const profile = await requireCurrentProfile();
  const t = title.trim();
  if (!t) throw new Error("Гарчиг заавал.");
  const db = getDb();
  const posRows = await db
    .select({ maxPos: max(collection.position) })
    .from(collection)
    .where(eq(collection.profileId, profile.id));
  // Slug is unique per profile — suffix on collision.
  let slug = slugify(t);
  const existing = await db
    .select({ slug: collection.slug })
    .from(collection)
    .where(eq(collection.profileId, profile.id));
  const taken = new Set(existing.map((e) => e.slug));
  if (taken.has(slug)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  await db.insert(collection).values({
    profileId: profile.id,
    title: t,
    slug,
    description: description?.trim() || null,
    position: (posRows[0]?.maxPos ?? -1) + 1,
  });
  revalidatePath("/dashboard");
}

export async function renameCollection(id: string, title: string) {
  const profile = await requireCurrentProfile();
  const db = getDb();
  await db
    .update(collection)
    .set({ title: title.trim() })
    .where(and(eq(collection.id, id), eq(collection.profileId, profile.id)));
  revalidatePath("/dashboard");
}

export async function deleteCollection(id: string) {
  const profile = await requireCurrentProfile();
  const db = getDb();
  // Picks in this collection are set to null (ungrouped) by the FK, so nothing
  // is lost — they fall back to the default shelf.
  await db
    .delete(collection)
    .where(and(eq(collection.id, id), eq(collection.profileId, profile.id)));
  revalidatePath("/dashboard");
}

/** Reorder: takes ordered ids, writes their new positions. Scoped to owner. */
export async function reorderCollections(orderedIds: string[]) {
  const profile = await requireCurrentProfile();
  const db = getDb();
  await Promise.all(
    orderedIds.map((id, i) =>
      db
        .update(collection)
        .set({ position: i })
        .where(
          and(eq(collection.id, id), eq(collection.profileId, profile.id)),
        ),
    ),
  );
  revalidatePath("/dashboard");
}
