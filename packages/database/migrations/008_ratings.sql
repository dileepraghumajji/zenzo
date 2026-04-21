-- Sprint UC5 — Ratings & Reviews
-- club_reviews: one review per user per club
-- coach_ratings: one rating per user per coach per club

CREATE TABLE club_reviews (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id          UUID        NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  reviewer_user_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating           SMALLINT    NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text      TEXT        CHECK (char_length(review_text) <= 500),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  UNIQUE (club_id, reviewer_user_id)
);

CREATE TABLE coach_ratings (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  club_id          UUID        NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  reviewer_user_id UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating           SMALLINT    NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text      TEXT        CHECK (char_length(review_text) <= 500),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at       TIMESTAMPTZ,
  UNIQUE (coach_user_id, club_id, reviewer_user_id)
);

CREATE INDEX idx_club_reviews_club_rating
  ON club_reviews (club_id, rating) WHERE deleted_at IS NULL;

CREATE INDEX idx_coach_ratings_coach_rating
  ON coach_ratings (coach_user_id, rating) WHERE deleted_at IS NULL;

-- RLS

ALTER TABLE club_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read non-deleted club reviews"
  ON club_reviews FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Auth users can insert their own club review"
  ON club_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_user_id);

CREATE POLICY "Auth users can update their own club review"
  ON club_reviews FOR UPDATE USING (auth.uid() = reviewer_user_id);

ALTER TABLE coach_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read non-deleted coach ratings"
  ON coach_ratings FOR SELECT USING (deleted_at IS NULL);

CREATE POLICY "Auth users can insert their own coach rating"
  ON coach_ratings FOR INSERT WITH CHECK (auth.uid() = reviewer_user_id);

CREATE POLICY "Auth users can update their own coach rating"
  ON coach_ratings FOR UPDATE USING (auth.uid() = reviewer_user_id);

-- Denormalized avg_rating on clubs, maintained by trigger to avoid per-request aggregation
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2);

CREATE OR REPLACE FUNCTION refresh_club_avg_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE clubs
  SET avg_rating = (
    SELECT ROUND(AVG(rating)::NUMERIC, 2)
    FROM club_reviews
    WHERE club_id = COALESCE(NEW.club_id, OLD.club_id)
      AND deleted_at IS NULL
  )
  WHERE id = COALESCE(NEW.club_id, OLD.club_id);
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_club_reviews_avg_rating
AFTER INSERT OR UPDATE OR DELETE ON club_reviews
FOR EACH ROW EXECUTE FUNCTION refresh_club_avg_rating();
