-- Sprint T: Invite Token System
-- Creates the club_invites table to track pending member invitations.
-- Tokens are UUIDs used as URL-safe invite links (/signup?token=xxx).

CREATE TABLE IF NOT EXISTS club_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id     UUID REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  email       TEXT NOT NULL,
  token       TEXT UNIQUE NOT NULL,
  plan_id     UUID REFERENCES fee_plans(id) ON DELETE SET NULL,
  batch_id    UUID REFERENCES batches(id) ON DELETE SET NULL,
  invited_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT now() + interval '30 days'
);

-- Index for fast lookup by token (activate-invite endpoint)
CREATE INDEX IF NOT EXISTS club_invites_token_idx ON club_invites (token);

-- Index for fast lookup by email (check-on-signup flow)
CREATE INDEX IF NOT EXISTS club_invites_email_idx ON club_invites (email);

-- RLS: club staff can read invites for their club
ALTER TABLE club_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view their club invites"
  ON club_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM club_staff
      WHERE club_staff.club_id = club_invites.club_id
        AND club_staff.user_id = auth.uid()
    )
  );
