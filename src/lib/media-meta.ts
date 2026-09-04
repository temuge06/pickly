/**
 * Readers for the three things stored in `activity_item.meta` that both the
 * editor and the public profile need: the creator's star rating, whether a row
 * on the film shelf is a TV series rather than a movie, and the position the
 * creator dragged the row to.
 *
 * `meta` is a jsonb column typed as `Record<string, unknown>`, i.e. anything —
 * rows written by earlier syncs, by a future adapter, or by hand carry
 * whatever they carry. So these narrow rather than cast: a rating that is a
 * string, out of range, or missing reads as "no rating", which is exactly how
 * an unrated item should render.
 *
 * Client-safe (no database import), so the dashboard's rating row and the
 * public shelf can share one definition instead of re-implementing the shape.
 */

export const MAX_RATING = 5;

/** The creator's 1–5 rating, or null when unset or unusable. */
export function readRating(meta: unknown): number | null {
  if (!meta || typeof meta !== "object") return null;
  const raw = (meta as Record<string, unknown>).rating;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  const n = Math.round(raw);
  return n >= 1 && n <= MAX_RATING ? n : null;
}

/** True for a TV series sitting on the film shelf (see searchFilms). */
export function isSeriesItem(meta: unknown): boolean {
  if (!meta || typeof meta !== "object") return false;
  return (meta as Record<string, unknown>).tv === true;
}

/**
 * The creator's own ordering for a shelf, or null while they have never
 * reordered this row.
 *
 * It lives in `meta` rather than in a column of its own for the same reason
 * `rating` does: the column exists precisely for per-row extras, the value is
 * only ever read alongside the row it belongs to, and it needs no migration
 * against a database that is already serving public profiles.
 */
export function readPosition(meta: unknown): number | null {
  if (!meta || typeof meta !== "object") return null;
  const raw = (meta as Record<string, unknown>).position;
  if (typeof raw !== "number" || !Number.isFinite(raw)) return null;
  return raw;
}

/**
 * Apply the creator's ordering to a shelf that arrived in the database's
 * default order (newest first).
 *
 * A row with no position sorts BEFORE every placed row, not after: an item
 * added since the last reorder is the newest thing on the shelf, and the
 * default this whole feature sits on top of is newest-first. Sorting is stable,
 * so those unplaced rows keep the occurredAt order they came in with.
 */
export function sortByPosition<T extends { meta: unknown }>(items: T[]): T[] {
  return items
    .map((item, i) => ({ item, i, pos: readPosition(item.meta) }))
    .sort((a, b) => {
      if (a.pos === null && b.pos === null) return a.i - b.i;
      if (a.pos === null) return -1;
      if (b.pos === null) return 1;
      return a.pos - b.pos || a.i - b.i;
    })
    .map((e) => e.item);
}
