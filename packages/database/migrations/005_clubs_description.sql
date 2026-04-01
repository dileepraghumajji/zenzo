-- Add description column to clubs table
-- Used on public club listing pages and the explore page.

ALTER TABLE clubs
  ADD COLUMN IF NOT EXISTS description TEXT;
