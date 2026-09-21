-- A promo code is single-use across the whole audience: the first tap by
-- anyone (a visitor, a signed-in fan, the creator themselves) claims it and
-- greys it out for everybody. That is a fact about the code, so it lives on
-- the row — the old per-browser localStorage flag only greyed it for the one
-- device that tapped it. Null = still live. Staff can clear it to re-open.
ALTER TABLE "promo_code" ADD COLUMN IF NOT EXISTS "used_at" timestamp with time zone;
