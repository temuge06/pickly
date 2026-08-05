-- Row Level Security policies. Applied by src/db/migrate.ts after the Drizzle
-- migrations. Idempotent: every policy is dropped-if-exists then recreated, so
-- re-running migrate is safe.
--
-- Security model (see README): our trusted server code talks to Postgres over
-- the direct DATABASE_URL connection (superuser role), which BYPASSES RLS —
-- there, ownership is enforced in code by deriving profile_id from the
-- authenticated Supabase session, never from client input. These policies are
-- the mandated backstop: they make the public anon key (NEXT_PUBLIC_...) safe
-- to expose, so that anyone hitting PostgREST with it can read only published
-- rows and write nothing they don't own.
--
-- Depends on Supabase's auth.uid(). Migrations target a Supabase Postgres.

-- Helper: the set of profile ids owned by the current authenticated user.
-- SECURITY DEFINER + stable so policies stay cheap and don't recurse into
-- profile's own RLS.
CREATE OR REPLACE FUNCTION public.owned_profile_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profile WHERE user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS on every table.
-- ---------------------------------------------------------------------------
ALTER TABLE public.profile        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_item  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pick           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ask_message    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ask_block      ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- profile
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS profile_anon_read ON public.profile;
CREATE POLICY profile_anon_read ON public.profile
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS profile_owner_read ON public.profile;
CREATE POLICY profile_owner_read ON public.profile
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS profile_owner_insert ON public.profile;
CREATE POLICY profile_owner_insert ON public.profile
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS profile_owner_update ON public.profile;
CREATE POLICY profile_owner_update ON public.profile
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- connection — holds encrypted tokens. No anon access at all.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS connection_owner_all ON public.connection;
CREATE POLICY connection_owner_all ON public.connection
  FOR ALL TO authenticated
  USING (profile_id IN (SELECT public.owned_profile_ids()))
  WITH CHECK (profile_id IN (SELECT public.owned_profile_ids()));

-- ---------------------------------------------------------------------------
-- activity_item — public content. Anon reads items whose owning connection is
-- active, plus manual items (no connection row → provider not in connections).
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS activity_item_anon_read ON public.activity_item;
CREATE POLICY activity_item_anon_read ON public.activity_item
  FOR SELECT TO anon USING (
    NOT EXISTS (
      SELECT 1 FROM public.connection c
      WHERE c.profile_id = activity_item.profile_id
        AND c.provider::text = activity_item.provider
        AND c.status <> 'active'
    )
  );

DROP POLICY IF EXISTS activity_item_owner_all ON public.activity_item;
CREATE POLICY activity_item_owner_all ON public.activity_item
  FOR ALL TO authenticated
  USING (profile_id IN (SELECT public.owned_profile_ids()))
  WITH CHECK (profile_id IN (SELECT public.owned_profile_ids()));

-- ---------------------------------------------------------------------------
-- collection — public groupings.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS collection_anon_read ON public.collection;
CREATE POLICY collection_anon_read ON public.collection
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS collection_owner_all ON public.collection;
CREATE POLICY collection_owner_all ON public.collection
  FOR ALL TO authenticated
  USING (profile_id IN (SELECT public.owned_profile_ids()))
  WITH CHECK (profile_id IN (SELECT public.owned_profile_ids()));

-- ---------------------------------------------------------------------------
-- pick — anon sees active picks only.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS pick_anon_read ON public.pick;
CREATE POLICY pick_anon_read ON public.pick
  FOR SELECT TO anon USING (is_active = true);

DROP POLICY IF EXISTS pick_owner_all ON public.pick;
CREATE POLICY pick_owner_all ON public.pick
  FOR ALL TO authenticated
  USING (profile_id IN (SELECT public.owned_profile_ids()))
  WITH CHECK (profile_id IN (SELECT public.owned_profile_ids()));

-- ---------------------------------------------------------------------------
-- link — public.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS link_anon_read ON public.link;
CREATE POLICY link_anon_read ON public.link
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS link_owner_all ON public.link;
CREATE POLICY link_owner_all ON public.link
  FOR ALL TO authenticated
  USING (profile_id IN (SELECT public.owned_profile_ids()))
  WITH CHECK (profile_id IN (SELECT public.owned_profile_ids()));

-- ---------------------------------------------------------------------------
-- ask_message — anon reads only published answered Q&As. Anon cannot INSERT
-- via PostgREST; submissions go through the server action (service role) so
-- IP-hash, rate-limit, and wordlist filtering always run.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS ask_message_anon_read ON public.ask_message;
CREATE POLICY ask_message_anon_read ON public.ask_message
  FOR SELECT TO anon USING (is_public = true AND status = 'answered');

DROP POLICY IF EXISTS ask_message_owner_all ON public.ask_message;
CREATE POLICY ask_message_owner_all ON public.ask_message
  FOR ALL TO authenticated
  USING (profile_id IN (SELECT public.owned_profile_ids()))
  WITH CHECK (profile_id IN (SELECT public.owned_profile_ids()));

-- ---------------------------------------------------------------------------
-- ask_block — creator-only, no anon.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS ask_block_owner_all ON public.ask_block;
CREATE POLICY ask_block_owner_all ON public.ask_block
  FOR ALL TO authenticated
  USING (profile_id IN (SELECT public.owned_profile_ids()))
  WITH CHECK (profile_id IN (SELECT public.owned_profile_ids()));
