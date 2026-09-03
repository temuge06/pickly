/**
 * Readers for the two things stored in `activity_item.meta` that both the
 * editor and the public profile need: the creator's star rating and whether a
 * row on the film shelf is a TV series rather than a movie.
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
