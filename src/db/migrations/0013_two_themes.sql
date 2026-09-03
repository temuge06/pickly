-- Retire the two warm palettes. The designer's review cut "On Fire" and
-- "Coral Wave"; what ships is one dark theme and one light theme, renamed for
-- creators as Dark Mode (dalai_1) and Light Mode (dalai_2).
--
-- The ENUM VALUES stay. Dropping a value from a Postgres enum means recreating
-- the type and rewriting every column that uses it, for no gain: nothing reads
-- a retired value once the rows below are moved, and src/lib/themes.ts maps
-- either legacy key onto the surviving palette of the same brightness anyway,
-- so a database where this migration has not run still renders correctly.
--
-- Each row lands on the variant whose figure/ground it already had — On Fire
-- was the dark warm theme, Coral Wave the light one — so no creator's page
-- flips from dark to light or back underneath them.
UPDATE "profile" SET "theme" = 'dalai_1' WHERE "theme" = 'on_fire';
--> statement-breakpoint
UPDATE "profile" SET "theme" = 'dalai_2' WHERE "theme" = 'coral_wave';
--> statement-breakpoint
ALTER TABLE "profile" ALTER COLUMN "theme" SET DEFAULT 'dalai_1';
