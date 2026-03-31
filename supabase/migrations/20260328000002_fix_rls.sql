-- Fix infinite recursion in club_staff and clubs RLS policies
-- We use SECURITY DEFINER functions to bypass RLS when looking up user's club IDs and roles.

-- 1. Helper: get all club_ids for the current user (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_club_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  select club_id from club_staff where user_id = auth.uid();
$$;

-- 2. Helper: get the user's role in a specific club (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_role_in_club(p_club_id uuid)
RETURNS staff_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  select role from club_staff
  where user_id = auth.uid() and club_id = p_club_id
  limit 1;
$$;

-- 3. Drop the recursive policies
DROP POLICY IF EXISTS "club_staff: staff can read all staff in their club" ON public.club_staff;
DROP POLICY IF EXISTS "club_staff: owner can manage staff" ON public.club_staff;
DROP POLICY IF EXISTS "clubs: staff can read their club" ON public.clubs;
DROP POLICY IF EXISTS "clubs: owner can update their club" ON public.clubs;

-- 4. Recreate policies using SECURITY DEFINER helpers (no direct subqueries on club_staff)
CREATE POLICY "club_staff: staff can read all staff in their club"
  ON public.club_staff FOR SELECT
  USING (club_id IN (SELECT public.get_user_club_ids()));

CREATE POLICY "club_staff: owner can manage staff"
  ON public.club_staff FOR ALL
  USING (
    club_id IN (SELECT public.get_user_club_ids())
    AND public.get_user_role_in_club(club_id) = 'owner'
  );

CREATE POLICY "clubs: staff can read their club"
  ON public.clubs FOR SELECT
  USING (id IN (SELECT public.get_user_club_ids()));

CREATE POLICY "clubs: owner can update their club"
  ON public.clubs FOR UPDATE
  USING (
    id IN (SELECT public.get_user_club_ids())
    AND public.get_user_role_in_club(id) = 'owner'
  );
