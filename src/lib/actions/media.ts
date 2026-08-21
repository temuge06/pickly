"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { activityItem } from "@/db/schema";
import { requireCurrentProfile } from "@/lib/auth/session";
import { searchBooks, searchFilms, type MediaResult } from "@/lib/metadata/search";

export async function searchFilmsAction(query: string): Promise<MediaResult[]> {
  await requireCurrentProfile();
  return searchFilms(query);
}

export async function searchBooksAction(query: string): Promise<MediaResult[]> {
  await requireCurrentProfile();
  return searchBooks(query);
}

/**
 * Add a manually-chosen song, film or book as an activity_item. Manual items
 * have provider 'manual' and `tmdb:`/`openlibrary:`/`itunes:` external ids and
 * no connection, so they always show on the public page (no sync health gate).
 *
 * `meta` carries whatever is specific to one kind and has no column of its own
 * — for a song that is the iTunes track id, the album, and the 30s preview the
 * public player streams.
 */
export async function addMediaItem(input: {
  kind: "film" | "book" | "track";
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  externalUrl?: string | null;
  externalId?: string | null;
  meta?: Record<string, unknown>;
}) {
  const profile = await requireCurrentProfile();
  const title = input.title.trim();
  if (!title) throw new Error("Нэр заавал.");
  const db = getDb();

  await db
    .insert(activityItem)
    .values({
      profileId: profile.id,
      provider: "manual",
      kind: input.kind,
      externalId:
        input.externalId?.trim() ||
        `manual:${input.kind}:${title}:${Date.now()}`,
      title,
      subtitle: input.subtitle?.trim() || null,
      imageUrl: input.imageUrl?.trim() || null,
      externalUrl: input.externalUrl?.trim() || null,
      occurredAt: new Date(),
      meta: input.meta ?? {},
    })
    .onConflictDoNothing();
  revalidatePath("/dashboard");
}

export async function deleteMediaItem(id: string) {
  const profile = await requireCurrentProfile();
  const db = getDb();
  await db
    .delete(activityItem)
    .where(and(eq(activityItem.id, id), eq(activityItem.profileId, profile.id)));
  revalidatePath("/dashboard");
}
