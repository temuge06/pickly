-- Letterboxd is no longer a product surface: the connect field is gone from
-- the dashboard and `src/lib/sync/run.ts` no longer registers an adapter for
-- the provider, so any surviving connection row would fail every cron pass
-- with "No adapter for provider".
--
-- Films already pulled in are the creator's own history and stay. They are
-- re-tagged `manual` because getPublicProfile hides activity belonging to a
-- provider whose connection is not active — leaving them as 'letterboxd' with
-- the connection deleted would silently empty the Кино tab. As `manual` rows
-- they also become deletable from the dashboard, which they never were.
UPDATE "activity_item" SET "provider" = 'manual' WHERE "provider" = 'letterboxd';

DELETE FROM "connection" WHERE "provider" = 'letterboxd';

-- The enum value itself is kept: dropping a value from a Postgres enum means
-- recreating the type, and nothing references it any more.
