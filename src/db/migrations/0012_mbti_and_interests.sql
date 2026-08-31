-- Replace the free-text bio-shelf tags with the two fields they actually
-- represent (Figma 1291:10350 — "ENTJ", "Marketing", "Boxing").
--
-- `tags` shipped earlier the same day as an open text[] before onboarding was
-- designed. The design's three chips are one MBTI type plus the creator's
-- leading interests, which is why the first chip is filled and the rest are
-- outlined. Modelling that as one anonymous list meant the filled chip was
-- "whatever you typed first" and nothing could ever be matched across
-- profiles. Splitting it makes both closed sets: sixteen types, and a
-- catalogue of interest keys (src/lib/personality.ts).
--
-- Dropping rather than migrating the old column: it existed for hours, holds
-- only seeded demo values, and its contents are free text that cannot be
-- mapped onto either closed set without guessing.
ALTER TABLE "profile" DROP COLUMN IF EXISTS "tags";

ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "mbti" text;
ALTER TABLE "profile" ADD COLUMN IF NOT EXISTS "interests" text[] NOT NULL DEFAULT '{}'::text[];

-- The sixteen types, enforced in the database as well as in zod. A CHECK
-- rather than an enum: adding or removing a value from a Postgres enum means
-- recreating the type, and this set is fixed anyway. NULL is allowed because
-- the step is skippable.
ALTER TABLE "profile" DROP CONSTRAINT IF EXISTS "profile_mbti_valid";
ALTER TABLE "profile" ADD CONSTRAINT "profile_mbti_valid" CHECK (
  "mbti" IS NULL OR "mbti" IN (
    'INTJ','INTP','ENTJ','ENTP',
    'INFJ','INFP','ENFJ','ENFP',
    'ISTJ','ISFJ','ESTJ','ESFJ',
    'ISTP','ISFP','ESTP','ESFP'
  )
);
