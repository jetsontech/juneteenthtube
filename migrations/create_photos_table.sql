-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    photo_url TEXT NOT NULL,
    caption TEXT,
    state TEXT DEFAULT 'GLOBAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (same as videos table)
CREATE POLICY "Allow all operations on photos" ON photos
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Move the PNG file from videos to photos
INSERT INTO photos (id, title, photo_url, caption, state, created_at)
SELECT 
    id,
    title,
    video_url as photo_url,
    '' as caption,
    COALESCE(state, 'GLOBAL') as state,
    created_at
FROM videos
WHERE id = '40fc019c-e734-4a2d-9a9a-b9a576636bd2';

-- Delete the entry from videos table
DELETE FROM videos WHERE id = '40fc019c-e734-4a2d-9a9a-b9a576636bd2';
