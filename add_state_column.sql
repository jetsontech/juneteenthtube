-- Add state column to videos table for geographic filtering
-- Run this in Supabase SQL Editor

-- Add the state column
ALTER TABLE videos ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'GLOBAL';

-- Add an index for faster state-based queries
CREATE INDEX IF NOT EXISTS idx_videos_state ON videos(state);

-- Update existing videos to have 'GLOBAL' as default state
UPDATE videos SET state = 'GLOBAL' WHERE state IS NULL;
