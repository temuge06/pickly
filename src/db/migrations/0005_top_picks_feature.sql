-- Adds the Top Picks switch. A new enum value cannot be added inside a
-- transaction block on older Postgres, and Drizzle wraps migrations, so this
-- uses the IF NOT EXISTS form which is safe to re-run and does not require its
-- own transaction on PG12+.
ALTER TYPE "public"."feature" ADD VALUE IF NOT EXISTS 'top_picks';
