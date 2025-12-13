-- Add channel info columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'channel_name') THEN
        ALTER TABLE videos ADD COLUMN channel_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'channel_avatar') THEN
        ALTER TABLE videos ADD COLUMN channel_avatar TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'views') THEN
        ALTER TABLE videos ADD COLUMN views TEXT; -- Storing as text for "1.2M" format, or integer? Mock used strings.
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'duration') THEN
        ALTER TABLE videos ADD COLUMN duration TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'category') THEN
        ALTER TABLE videos ADD COLUMN category TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'posted_at') THEN
        ALTER TABLE videos ADD COLUMN posted_at TEXT; -- Mock relative time string
    END IF;
END $$;
