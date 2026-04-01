-- Sprint PH: Phone-First Invite System
-- Makes email optional and adds phone as the primary invite identifier.

-- email was NOT NULL — make it nullable so phone-only invites work
ALTER TABLE club_invites ALTER COLUMN email DROP NOT NULL;

-- Add phone column for phone-first lookup and WhatsApp link generation
ALTER TABLE club_invites ADD COLUMN IF NOT EXISTS phone TEXT;

-- Index for fast lookup by phone (activate-invite sweep on signup)
CREATE INDEX IF NOT EXISTS club_invites_phone_idx ON club_invites (phone);
