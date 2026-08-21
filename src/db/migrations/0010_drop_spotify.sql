-- Spotify is no longer a product surface. Songs are added by hand from iTunes
-- Search (src/lib/metadata/search.ts `searchMusic`), so there is no OAuth
-- connect flow, no stored tokens, and src/lib/sync/run.ts registers no adapter
-- for the provider — a surviving connection row would fail every cron pass
-- with "No adapter for provider".
--
-- Migration 0008 retired letterboxd by re-tagging its rows `manual` wholesale.
-- That is not enough here, because the sync wrote a row per song PER PASS: at
-- the time of writing one profile held 410 rows for 228 distinct songs, with
-- its #1 track stored eight times over. Re-tagging all of them would publish a
-- visibly duplicated list on a section that now means "songs I chose".
--
-- So: keep the favourites, one row each, and drop the listening exhaust.

-- 1. Demo fixtures. The seed's Spotify-shaped tracks are replaced by
--    iTunes-shaped ones reusing the SAME ids, and insertMany is
--    onConflictDoNothing — without clearing these first, `pnpm db:seed` would
--    silently keep the stale rows.
DELETE FROM "activity_item"
WHERE "provider" = 'spotify'
  AND "id" IN (
    'a0000000-0000-4000-8000-000000000001',
    'a0000000-0000-4000-8000-000000000002',
    'a0000000-0000-4000-8000-000000000003',
    'a0000000-0000-4000-8000-000000000004',
    'a0000000-0000-4000-8000-000000000005',
    'a0000000-0000-4000-8000-000000000006'
  );

-- 2. `recently_played` was a firehose — everything the creator happened to
--    press play on, never anything they picked. It has no place in a curated
--    section, and it is the bulk of the rows.
DELETE FROM "activity_item"
WHERE "provider" = 'spotify' AND "meta"->>'source' = 'recently_played';

-- 3. What remains is `top_tracks`, re-written on every pass. Collapse to one
--    row per song per profile, preferring the best rank it ever held and, at
--    equal rank, the most recent sighting.
DELETE FROM "activity_item"
WHERE "id" IN (
  SELECT "id" FROM (
    SELECT "id", row_number() OVER (
      PARTITION BY "profile_id", "external_id"
      ORDER BY ("meta"->>'rank')::int NULLS LAST, "occurred_at" DESC, "id"
    ) AS rn
    FROM "activity_item"
    WHERE "provider" = 'spotify'
  ) ranked
  WHERE rn > 1
);

-- 4. Survivors become the creator's own manual entries. `manual` is what makes
--    the dashboard offer a Устгах button on them (it renders one only for
--    `manual` rows, and would otherwise label them "Синк" — a sync that can no
--    longer run). They keep their Spotify external_url and album art, so the
--    public card still links out; what they lack is meta.preview_url, and both
--    players fall back to that outbound link for exactly these rows.
UPDATE "activity_item" SET "provider" = 'manual' WHERE "provider" = 'spotify';

-- 5. Tokens die with the row. ENCRYPTION_KEY stays in use for Ask IP hashing.
DELETE FROM "connection" WHERE "provider" = 'spotify';

-- The enum value itself is kept, for the reason 0008 gives: dropping a value
-- from a Postgres enum means recreating the type, and nothing references it
-- any more.
