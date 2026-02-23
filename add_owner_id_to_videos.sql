-- Add owner_id to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_videos_owner_id ON videos(owner_id);

-- Update RLS policies (Optional, but recommended for security)
-- Allow users to delete/update their own videos
-- CREATE POLICY "Users can update their own videos" ON videos FOR UPDATE USING (auth.uid() = owner_id);
-- CREATE POLICY "Users can delete their own videos" ON videos FOR DELETE USING (auth.uid() = owner_id);
