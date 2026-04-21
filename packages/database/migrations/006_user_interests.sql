-- Sprint UC1.1: Interest Onboarding
-- Migration: User profile fields + interest tables

-- Add profile fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio TEXT CHECK(char_length(bio) <= 160),
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS username TEXT UNIQUE CHECK(username ~ '^[a-z0-9_]{3,30}$'),
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_step TEXT CHECK(onboarding_step IN ('interests_done', 'interests_skipped'));

-- Create user_interests table
CREATE TABLE IF NOT EXISTS user_interests (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  slug TEXT NOT NULL CHECK(slug IN ('martial_arts', 'fitness', 'dance', 'yoga', 'boxing', 'swimming', 'crossfit', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, slug)
);

-- Unique index for case-insensitive username lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users (lower(username));

-- Enable RLS on user_interests
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view user interests"
  ON user_interests FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own interests"
  ON user_interests FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
