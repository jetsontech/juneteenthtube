-- Add custom featured columns to support distinct carousel text overrides
ALTER TABLE videos ADD COLUMN IF NOT EXISTS featured_title TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS featured_category TEXT;
