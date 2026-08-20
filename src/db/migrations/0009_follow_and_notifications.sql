-- Following + the notification bell.
--
-- `follow` is the only new table. There is deliberately NO `notification`
-- table: the feed is derived at read time from the rows that already exist
-- (activity_item, campaign_assignment, promo_code, ask_message), so a new
-- notification source needs no fan-out writes, no backfill, and cannot miss
-- an event because a trigger did not fire. Read state is a single watermark
-- on `profile` instead of a row per (user, event) pair.
CREATE TABLE IF NOT EXISTS "follow" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "follower_profile_id" uuid NOT NULL REFERENCES "profile"("id") ON DELETE CASCADE,
  "following_profile_id" uuid NOT NULL REFERENCES "profile"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  -- Belt and braces with the check in followProfile(): a self-follow would put
  -- the creator's own posts in their own feed.
  CONSTRAINT "follow_not_self" CHECK ("follower_profile_id" <> "following_profile_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "follow_pair_unique"
  ON "follow" ("follower_profile_id", "following_profile_id");

CREATE INDEX IF NOT EXISTS "follow_following_idx"
  ON "follow" ("following_profile_id");

ALTER TABLE "profile"
  ADD COLUMN IF NOT EXISTS "notifications_seen_at" timestamp with time zone;

-- The feed asks "what appeared since <watermark>" per followed profile, which
-- is a range scan on created_at inside a profile_id filter.
CREATE INDEX IF NOT EXISTS "activity_item_profile_created_idx"
  ON "activity_item" ("profile_id", "created_at");
