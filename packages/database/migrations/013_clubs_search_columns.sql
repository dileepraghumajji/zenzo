-- SD1.2: Add discovery/search columns to clubs. No drops, no renames.

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS tagline              TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url      TEXT,
  ADD COLUMN IF NOT EXISTS gallery              TEXT[],
  ADD COLUMN IF NOT EXISTS subcategories        TEXT[],
  ADD COLUMN IF NOT EXISTS amenities            TEXT[],
  ADD COLUMN IF NOT EXISTS operating_hours      JSONB,
  ADD COLUMN IF NOT EXISTS area                 TEXT,
  ADD COLUMN IF NOT EXISTS full_address         TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_url      TEXT,
  ADD COLUMN IF NOT EXISTS social_links         JSONB,
  ADD COLUMN IF NOT EXISTS location             geography(Point,4326),
  ADD COLUMN IF NOT EXISTS featured             BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS review_count         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS member_count         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS price_range          TEXT CHECK (price_range IN ('budget','mid','premium')),
  ADD COLUMN IF NOT EXISTS starting_price_paise INTEGER,
  ADD COLUMN IF NOT EXISTS established_year     SMALLINT,
  ADD COLUMN IF NOT EXISTS search_vector        TSVECTOR;

-- Geo + FTS indexes
CREATE INDEX IF NOT EXISTS clubs_location_idx        ON clubs USING GIST(location);
CREATE INDEX IF NOT EXISTS clubs_search_vector_idx   ON clubs USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS clubs_name_trgm_idx       ON clubs USING GIN(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS clubs_subcategories_idx   ON clubs USING GIN(subcategories);
CREATE INDEX IF NOT EXISTS clubs_amenities_idx       ON clubs USING GIN(amenities);

-- tsvector update function + trigger
CREATE OR REPLACE FUNCTION clubs_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.tagline, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.area, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(NEW.subcategories, '{}'), ' ')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(NEW.amenities, '{}'), ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clubs_search_vector_trigger ON clubs;
CREATE TRIGGER clubs_search_vector_trigger
  BEFORE INSERT OR UPDATE ON clubs
  FOR EACH ROW EXECUTE FUNCTION clubs_search_vector_update();

-- Back-fill search_vector for existing rows
UPDATE clubs SET search_vector = (
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(tagline, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(area, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'C')
);

-- Trigger that increments/decrements member_count when memberships change status
CREATE OR REPLACE FUNCTION sync_club_member_count() RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'active') OR
     (TG_OP = 'UPDATE' AND NEW.status = 'active' AND OLD.status <> 'active') THEN
    UPDATE clubs SET member_count = member_count + 1 WHERE id = NEW.club_id;
  ELSIF (TG_OP = 'UPDATE' AND OLD.status = 'active' AND NEW.status <> 'active') THEN
    UPDATE clubs SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.club_id;
  ELSIF (TG_OP = 'DELETE' AND OLD.status = 'active') THEN
    UPDATE clubs SET member_count = GREATEST(member_count - 1, 0) WHERE id = OLD.club_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_club_member_count_trigger ON club_memberships;
CREATE TRIGGER sync_club_member_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON club_memberships
  FOR EACH ROW EXECUTE FUNCTION sync_club_member_count();

-- Trigger that increments review_count when club_reviews are added/soft-deleted
CREATE OR REPLACE FUNCTION sync_club_review_count() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.deleted_at IS NULL THEN
    UPDATE clubs SET review_count = review_count + 1 WHERE id = NEW.club_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
      UPDATE clubs SET review_count = GREATEST(review_count - 1, 0) WHERE id = NEW.club_id;
    ELSIF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
      UPDATE clubs SET review_count = review_count + 1 WHERE id = NEW.club_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_club_review_count_trigger ON club_reviews;
CREATE TRIGGER sync_club_review_count_trigger
  AFTER INSERT OR UPDATE ON club_reviews
  FOR EACH ROW EXECUTE FUNCTION sync_club_review_count();
