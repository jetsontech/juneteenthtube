-- Add H.264 transcoded video URL column for Android compatibility
-- HEVC videos uploaded from iPhone will have a transcoded H.264 version stored here
ALTER TABLE videos ADD COLUMN IF NOT EXISTS video_url_h264 TEXT;

-- Add transcoding status column to track processing state
-- Values: NULL (no transcoding needed), 'pending', 'processing', 'completed', 'failed'
ALTER TABLE videos ADD COLUMN IF NOT EXISTS transcode_status TEXT;

COMMENT ON COLUMN videos.video_url_h264 IS 'URL to H.264 transcoded version for Android/non-HEVC devices';
COMMENT ON COLUMN videos.transcode_status IS 'Transcoding status: pending, processing, completed, failed';
