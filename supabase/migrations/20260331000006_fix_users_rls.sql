-- Fix 1: Staff can read user profiles for club members + co-staff
-- This fixes "Unknown" names in the members list.
-- Previously, users RLS only allowed "read own row", so joins from
-- club_memberships → users returned null for all members except self.

CREATE POLICY "users: staff can read member profiles"
  ON public.users FOR SELECT
  USING (
    id IN (
      SELECT cm.user_id
      FROM club_memberships cm
      WHERE cm.club_id IN (SELECT public.get_user_club_ids())
        AND cm.deleted_at IS NULL
    )
  );

CREATE POLICY "users: staff can read co-staff profiles"
  ON public.users FOR SELECT
  USING (
    id IN (
      SELECT cs.user_id
      FROM club_staff cs
      WHERE cs.club_id IN (SELECT public.get_user_club_ids())
    )
  );


-- Fix 2: Update handle_new_user to handle Google OAuth name field.
-- Google sets raw_user_meta_data->>'name', not 'full_name'.
-- Also detect google provider from app_metadata.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO users (id, full_name, phone, email, auth_provider)
  VALUES (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      'User'
    ),
    coalesce(nullif(trim(new.raw_user_meta_data->>'phone'), ''), ''),
    coalesce(new.email, ''),
    CASE
      WHEN new.app_metadata->>'provider' = 'google' THEN 'google'
      ELSE coalesce(new.raw_user_meta_data->>'auth_provider', 'email')
    END
  );
  RETURN new;
END;
$$;
