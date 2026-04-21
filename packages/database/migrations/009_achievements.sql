-- Migration 009: member_achievements
-- Stores badges awarded to members by club owners and coaches.

CREATE TABLE IF NOT EXISTS member_achievements (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_id     UUID        NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  title       TEXT        NOT NULL,
  description TEXT,
  badge_icon  TEXT,
  awarded_by  UUID        REFERENCES users(id),
  awarded_at  DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id  ON member_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_club_id  ON member_achievements(club_id);

ALTER TABLE member_achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can read achievements (public profiles show them)
CREATE POLICY "achievements_select_public"
  ON member_achievements FOR SELECT
  USING (true);

-- Only club staff (owner or coach) at the relevant club can award badges
CREATE POLICY "achievements_insert_staff"
  ON member_achievements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM club_staff
      WHERE club_staff.club_id = member_achievements.club_id
        AND club_staff.user_id = auth.uid()
        AND club_staff.role IN ('owner', 'coach')
    )
  );
