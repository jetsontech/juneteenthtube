-- Create the live_messages table for Realtime Chat
CREATE TABLE IF NOT EXISTS public.live_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    channel_id UUID REFERENCES public.channels(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    content TEXT NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.live_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read messages
CREATE POLICY "Anyone can read live_messages"
ON public.live_messages
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to insert their own messages
CREATE POLICY "Authenticated users can insert messages"
ON public.live_messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Turn on Realtime for the live_messages table
-- Note: You may also need to do this via the Supabase Dashboard:
-- Database -> Replication -> Click "0 tables" on supabase_realtime -> Toggle live_messages -> Save
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_messages;
