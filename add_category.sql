-- Add category column to videos table
-- Run this in your Supabase SQL Editor

ALTER TABLE videos ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'All';

-- Update any existing videos without a category to 'All'
UPDATE videos SET category = 'All' WHERE category IS NULL;
