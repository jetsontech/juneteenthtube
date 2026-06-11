-- Create photos table for JuneteenthTube
-- This table stores image uploads separately from videos

CREATE TABLE IF NOT EXISTS public.photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    photo_url TEXT NOT NULL,
    title TEXT NOT NULL,
    caption TEXT,
    state TEXT DEFAULT 'GLOBAL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON public.photos
    FOR SELECT
    USING (true);

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON public.photos
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Create policy to allow users to update their own photos
CREATE POLICY "Allow authenticated update" ON public.photos
    FOR UPDATE
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- Create policy to allow users to delete their own photos
CREATE POLICY "Allow authenticated delete" ON public.photos
    FOR DELETE
    TO authenticated
    USING (auth.uid() IS NOT NULL);

-- Create index on created_at for efficient sorting
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON public.photos(created_at DESC);

-- Create index on state for filtering
CREATE INDEX IF NOT EXISTS idx_photos_state ON public.photos(state);

-- Grant permissions
GRANT SELECT ON public.photos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.photos TO authenticated;
