-- Supabase Row Level Security policies for the prediction market app
-- Assumptions:
--   * profiles.id is the auth user id (uuid)
--   * picks.user_id references auth user id
--   * picks.market_id references markets.id
--   * markets.lock_time is a timestamptz cutoff for pick edits
--   * Admin users have JWT claim: auth.jwt()->'app_metadata'->>'role' = 'admin'

-- =====================================================
-- Enable RLS on all relevant tables
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolved_outcomes ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- profiles
-- =====================================================

-- Authenticated users can view all profiles.
CREATE POLICY "profiles_select_authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Users can update only their own profile.
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- =====================================================
-- markets
-- =====================================================

-- Any authenticated user can read markets.
CREATE POLICY "markets_select_authenticated"
ON public.markets
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert markets.
CREATE POLICY "markets_insert_admin"
ON public.markets
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Only admins can update markets.
CREATE POLICY "markets_update_admin"
ON public.markets
FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Only admins can delete markets.
CREATE POLICY "markets_delete_admin"
ON public.markets
FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- =====================================================
-- market_options
-- =====================================================

-- Any authenticated user can read market options.
CREATE POLICY "market_options_select_authenticated"
ON public.market_options
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert market options.
CREATE POLICY "market_options_insert_admin"
ON public.market_options
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Only admins can update market options.
CREATE POLICY "market_options_update_admin"
ON public.market_options
FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Only admins can delete market options.
CREATE POLICY "market_options_delete_admin"
ON public.market_options
FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- =====================================================
-- picks
-- =====================================================

-- Authenticated users can read all picks.
CREATE POLICY "picks_select_authenticated"
ON public.picks
FOR SELECT
TO authenticated
USING (true);

-- Users can insert only their own picks.
CREATE POLICY "picks_insert_own"
ON public.picks
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update only their own picks before market lock time.
-- This policy prevents changing picks after lock_time.
CREATE POLICY "picks_update_own_before_lock"
ON public.picks
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.markets m
    WHERE m.id = picks.market_id
      AND now() < m.lock_time
  )
)
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.markets m
    WHERE m.id = picks.market_id
      AND now() < m.lock_time
  )
);

-- (Optional explicit admin read policy; functionally covered by picks_select_authenticated.)
CREATE POLICY "picks_select_admin"
ON public.picks
FOR SELECT
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- =====================================================
-- resolved_outcomes
-- =====================================================

-- Authenticated users can read resolved outcomes.
CREATE POLICY "resolved_outcomes_select_authenticated"
ON public.resolved_outcomes
FOR SELECT
TO authenticated
USING (true);

-- Only admins can insert resolved outcomes (resolve markets).
CREATE POLICY "resolved_outcomes_insert_admin"
ON public.resolved_outcomes
FOR INSERT
TO authenticated
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Only admins can update resolved outcomes (change resolutions).
CREATE POLICY "resolved_outcomes_update_admin"
ON public.resolved_outcomes
FOR UPDATE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Only admins can delete resolved outcomes.
CREATE POLICY "resolved_outcomes_delete_admin"
ON public.resolved_outcomes
FOR DELETE
TO authenticated
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
