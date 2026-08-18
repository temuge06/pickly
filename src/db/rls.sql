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

-- Helper: is the current authenticated user staff? Membership in admin_user is
-- the whole authorization boundary for /admin — SECURITY DEFINER so the check
-- itself doesn't recurse into admin_user's own RLS, and STABLE so Postgres
-- evaluates it once per statement rather than per row.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_user WHERE auth_user_id = auth.uid()
  );
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
ALTER TABLE public.wishlist_item  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ask_message    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ask_block      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_user     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flag   ENABLE ROW LEVEL SECURITY;

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

-- Creators READ their own collections; staff restructure them.
DROP POLICY IF EXISTS collection_owner_all ON public.collection;
DROP POLICY IF EXISTS collection_owner_read ON public.collection;
CREATE POLICY collection_owner_read ON public.collection
  FOR SELECT TO authenticated
  USING (profile_id IN (SELECT public.owned_profile_ids()));

DROP POLICY IF EXISTS collection_admin_all ON public.collection;
CREATE POLICY collection_admin_all ON public.collection
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- pick — anon sees active picks only.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS pick_anon_read ON public.pick;
CREATE POLICY pick_anon_read ON public.pick
  FOR SELECT TO anon USING (is_active = true);

-- Creators READ their own picks and nothing more: adding, editing and
-- deleting products is an admin operation now (see pick_admin_all).
DROP POLICY IF EXISTS pick_owner_all ON public.pick;
DROP POLICY IF EXISTS pick_owner_read ON public.pick;
CREATE POLICY pick_owner_read ON public.pick
  FOR SELECT TO authenticated
  USING (profile_id IN (SELECT public.owned_profile_ids()));

-- Staff write to ANY creator's picks. Scoped by admin_user membership, not by
-- profile ownership — this is what makes /admin's "add to someone else's shelf"
-- legal at the row level.
DROP POLICY IF EXISTS pick_admin_all ON public.pick;
CREATE POLICY pick_admin_all ON public.pick
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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
-- wishlist_item — anon sees active items only; owner has full access.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS wishlist_item_anon_read ON public.wishlist_item;
CREATE POLICY wishlist_item_anon_read ON public.wishlist_item
  FOR SELECT TO anon USING (is_active = true);

-- Creators READ their own wishlist; staff curate it.
DROP POLICY IF EXISTS wishlist_item_owner_all ON public.wishlist_item;
DROP POLICY IF EXISTS wishlist_item_owner_read ON public.wishlist_item;
CREATE POLICY wishlist_item_owner_read ON public.wishlist_item
  FOR SELECT TO authenticated
  USING (profile_id IN (SELECT public.owned_profile_ids()));

DROP POLICY IF EXISTS wishlist_item_admin_all ON public.wishlist_item;
CREATE POLICY wishlist_item_admin_all ON public.wishlist_item
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

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

-- ---------------------------------------------------------------------------
-- profile — staff read every creator (the /admin creator search runs over this
-- with the caller's own session, so the search itself is RLS-checked).
-- Staff deliberately get no INSERT/UPDATE here: /admin edits picks, not
-- identity. Handle/bio/avatar stay the creator's own.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS profile_admin_read ON public.profile;
CREATE POLICY profile_admin_read ON public.profile
  FOR SELECT TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- admin_user — the grant table itself. A staff member may read the roster;
-- an ordinary creator may read ONLY their own row, which is exactly what the
-- middleware /admin check needs and nothing more. No INSERT/UPDATE/DELETE
-- policy exists for anyone: promoting an account is a superuser-only operation
-- run outside the app, so no request path can grant itself staff.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS admin_user_self_read ON public.admin_user;
CREATE POLICY admin_user_self_read ON public.admin_user
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS admin_user_admin_read ON public.admin_user;
CREATE POLICY admin_user_admin_read ON public.admin_user
  FOR SELECT TO authenticated USING (public.is_admin());

-- ---------------------------------------------------------------------------
-- feature_flag — not a secret (a disabled section is visibly absent anyway),
-- so anon and the owning creator may read. Only staff may write: a creator
-- must not be able to re-enable a section an admin turned off.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS feature_flag_anon_read ON public.feature_flag;
CREATE POLICY feature_flag_anon_read ON public.feature_flag
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS feature_flag_owner_read ON public.feature_flag;
CREATE POLICY feature_flag_owner_read ON public.feature_flag
  FOR SELECT TO authenticated
  USING (profile_id IN (SELECT public.owned_profile_ids()));

DROP POLICY IF EXISTS feature_flag_admin_all ON public.feature_flag;
CREATE POLICY feature_flag_admin_all ON public.feature_flag
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- ask_message — staff read the flagged "turn this into a pick" queue across
-- creators. Read-only: the creator still owns answering and publishing.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS ask_message_admin_read ON public.ask_message;
CREATE POLICY ask_message_admin_read ON public.ask_message
  FOR SELECT TO authenticated USING (public.is_admin());
