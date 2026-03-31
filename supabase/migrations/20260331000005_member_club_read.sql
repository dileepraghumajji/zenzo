-- Members need to read the clubs they belong to (portal home page).
-- Without this, club_memberships are fetched fine (member can read own)
-- but the subsequent clubs lookup returns empty due to staff-only SELECT policy.

CREATE POLICY "clubs: member can read clubs they belong to"
  ON clubs FOR SELECT
  USING (
    id IN (
      SELECT club_id FROM club_memberships
      WHERE user_id = auth.uid()
        AND deleted_at IS NULL
    )
  );
