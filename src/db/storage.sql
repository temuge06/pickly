-- Storage buckets.
--
-- Applied by src/db/migrate.ts on every run, after the Drizzle migrations and
-- alongside rls.sql. It lives outside the Drizzle journal for the same reason
-- rls.sql does: it touches a Supabase-managed schema (`storage`), not ours.
--
-- Without this, a fresh project has no bucket and every image write —
-- uploadAvatar, the campaign banner upload, and the pick-image re-host in
-- src/lib/storage/images.ts — fails at runtime with "Bucket not found". That
-- was previously a dashboard step nobody had written down, which is exactly
-- the kind of setup that goes missing when a project is recreated.
--
-- `public = true` is load-bearing: the app hands out `getPublicUrl()` links and
-- renders them in plain <img>/next/image tags with no signing step, so objects
-- have to be readable without a session. Nothing secret is ever put here — it
-- holds avatars, product shots and campaign artwork, all of which are already
-- public on the profile page.
--
-- Idempotent: safe to re-run on every migrate.
INSERT INTO storage.buckets (id, name, public)
VALUES ('pick-images', 'pick-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Writes go through the service-role client (src/lib/supabase/admin.ts), which
-- bypasses RLS, so no INSERT/UPDATE/DELETE policy is needed here. Reads of a
-- public bucket are served by the storage API without consulting RLS at all.
-- The explicit read policy below is belt-and-braces for any path that reaches
-- storage.objects through PostgREST with the anon key.
DROP POLICY IF EXISTS pick_images_anon_read ON storage.objects;
CREATE POLICY pick_images_anon_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'pick-images');
