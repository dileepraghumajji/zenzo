-- Fix onboarding RLS: tighten clubs INSERT policy to enforce owner_id = auth.uid()
-- This ensures only the authenticated user can create a club where they are the owner.

DROP POLICY IF EXISTS "clubs: authenticated users can create" ON public.clubs;

CREATE POLICY "clubs: authenticated users can create their own club"
  ON public.clubs FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Allow users to insert their own row (needed by /api/auth/signup upsert
-- as a fallback if the handle_new_user trigger didn't fire).
CREATE POLICY "users: insert own row"
  ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

