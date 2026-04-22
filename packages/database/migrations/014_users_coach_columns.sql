-- SD1.3: Add coach-specific discovery columns to users (nullable — non-coaches leave them null).
-- No separate coaches table: coaches are users with club_staff.role = 'coach'.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS specializations      TEXT[],
  ADD COLUMN IF NOT EXISTS certifications       TEXT[],
  ADD COLUMN IF NOT EXISTS experience_years     SMALLINT,
  ADD COLUMN IF NOT EXISTS languages            TEXT[],
  ADD COLUMN IF NOT EXISTS is_freelance         BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS session_price_paise  INTEGER,
  ADD COLUMN IF NOT EXISTS is_available         BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS users_specializations_idx ON users USING GIN(specializations);
