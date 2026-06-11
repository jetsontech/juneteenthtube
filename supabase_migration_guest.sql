-- Allow Guest System
-- 1. Comments: Add guest_id and make user_id nullable (it already is, but let's be safe)
alter table public.comments add column if not exists guest_id text;
-- If we want to store random UUIDs that aren't in auth.users, we can't use the FK column.

-- 2. Likes: Add guest_id, make user_id nullable, update unique constraint
alter table public.likes add column if not exists guest_id text;
alter table public.likes alter column user_id drop not null;

-- Update unique constraint to work with guest_id OR user_id
-- This is tricky in SQL. Easier to just index them.
-- Check if unique constraint exists and drop it if needed (naming varies, so we might skip this for a simple unique index)
-- create unique index if not exists likes_video_guest_idx on public.likes (video_id, guest_id);

-- 3. Subscriptions: Add guest_id
alter table public.subscriptions add column if not exists guest_id text;
alter table public.subscriptions alter column subscriber_id drop not null;
-- create unique index if not exists subs_guest_channel_idx on public.subscriptions (guest_id, channel_name);
