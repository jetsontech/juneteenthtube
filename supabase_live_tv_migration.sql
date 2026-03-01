-- 0. Clean up any old existing tables that might conflict
DROP TABLE IF EXISTS public.epg_data CASCADE;
DROP TABLE IF EXISTS public.channels CASCADE;

-- 1. Create the `channels` table
CREATE TABLE public.channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    stream_url TEXT, -- for external HLS/M3U8 streams
    is_internal_vod BOOLEAN DEFAULT false, -- if true, it uses J-Tube VODs
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create the `epg_data` table (Electronic Program Guide)
-- This defines what plays at what time on a channel
CREATE TABLE public.epg_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL, -- only used if it's an internal VOD
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Setup Row Level Security (RLS)
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epg_data ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies
-- Allow anyone to read channels and EPG data
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.channels FOR SELECT USING (true);

CREATE POLICY "EPG data is viewable by everyone." 
ON public.epg_data FOR SELECT USING (true);

-- Allow authenticated admins (if you have them) or service role to insert/update
CREATE POLICY "Service role can manage channels" 
ON public.channels USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage epg_data" 
ON public.epg_data USING (auth.role() = 'service_role');
