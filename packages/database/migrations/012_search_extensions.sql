-- SD1.1: Enable PostGIS and pg_trgm for geo-search and fuzzy full-text search.
-- pg_trgm may already be enabled from migration 007 — IF NOT EXISTS is safe.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
