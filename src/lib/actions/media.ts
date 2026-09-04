"use server";

import { and, eq, inArray } from "drizzle-orm";
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
  revalidatePath(`/${profile.handle}`);
}

/**
 * Star rating on a film, series or book, 1–5, or null to clear it.
 *
 * Stored in `activity_item.meta` rather than in a column of its own: the column
 * exists precisely for "provider-specific extras: rating, artist, isbn", the
 * value is read only alongside the row it belongs to, and adding it needs no
 * migration against a database the public profile is already serving from.
 *
 * Merged into the existing meta, never replacing it — a song's previewUrl and a
 * series' `tv` marker live in the same object.
 */
export async function setMediaRating(id: string, rating: number | null) {
  const profile = await requireCurrentProfile();
  const db = getDb();

  // Clamp instead of reject: this arrives from a five-button row, so an
  // out-of-range value means a bug on our side, not something to tell the
  // creator about mid-edit.
  const clean =
    rating === null ? null : Math.min(5, Math.max(1, Math.round(rating)));

  const rows = await db
    .select({ meta: activityItem.meta })
    .from(activityItem)
    .where(and(eq(activityItem.id, id), eq(activityItem.profileId, profile.id)))
    .limit(1);
  const current = rows[0];
  if (!current) return;

  const meta = { ...(current.meta ?? {}) } as Record<string, unknown>;
  if (clean === null) delete meta.rating;
  else meta.rating = clean;

  await db
    .update(activityItem)
    .set({ meta })
    .where(and(eq(activityItem.id, id), eq(activityItem.profileId, profile.id)));
  revalidatePath("/dashboard");
  revalidatePath(`/${profile.handle}`);
}

export async function deleteMediaItem(id: string) {
  const profile = await requireCurrentProfile();
  const db = getDb();
  await db
    .delete(activityItem)
    .where(and(eq(activityItem.id, id), eq(activityItem.profileId, profile.id)));
  revalidatePath("/dashboard");
  revalidatePath(`/${profile.handle}`);
}

/**
 * Put a shelf in the order the creator arranged it, by writing a `position`
 * into each row's meta.
 *
 * Takes the whole ordered list of ids for ONE shelf rather than a single
 * move, for the same reason `reorderLinks` does: the client already knows the
 * final order, and rewriting all of it is what stops a half-applied swap from
 * leaving two rows sharing a position.
 *
 * Merged into the existing meta, never replacing it — the same object carries
 * a song's previewUrl, a series' `tv` marker and a star rating.
 */
export async function reorderMediaItems(orderedIds: string[]) {
  const profile = await requireCurrentProfile();
  if (orderedIds.length === 0) return;
  const db = getDb();

  // Scoped read first: an id belonging to someone else simply is not in the
  // result, so it can never be written to.
  const rows = await db
    .select({ id: activityItem.id, meta: activityItem.meta })
    .from(activityItem)
    .where(
      and(
        eq(activityItem.profileId, profile.id),
        inArray(activityItem.id, orderedIds),
      ),
    );
  const metaById = new Map(rows.map((r) => [r.id, r.meta ?? {}]));

  await Promise.all(
    orderedIds.map((id, i) => {
      const meta = metaById.get(id);
      if (!meta) return null;
      return db
        .update(activityItem)
        .set({ meta: { ...meta, position: i } })
        .where(
          and(
            eq(activityItem.id, id),
            eq(activityItem.profileId, profile.id),
          ),
        );
    }),
  );

  revalidatePath("/dashboard");
  revalidatePath(`/${profile.handle}`);
}
