-- Sprint UC3: Enable trigram extension + GIN indexes for fuzzy search
-- These indexes accelerate ILIKE '%query%' patterns by 10-100x on large tables.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_clubs_name_trgm     ON clubs USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_fullname_trgm ON users USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING gin (username gin_trgm_ops);
