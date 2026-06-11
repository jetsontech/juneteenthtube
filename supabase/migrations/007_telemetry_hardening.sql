-- 1. Hardening Access Policies
alter table public.analytics_events disable row level security;
alter table public.analytics_events enable row level security;

-- Drop the overly permissive insert policy
drop policy if exists "Anyone can insert analytics events" on public.analytics_events;

-- Create restrictive policy: Only service role can insert (API handles inserts via Admin client)
create policy "Analytics events insertable by service role only" 
on public.analytics_events 
for insert 
with check (auth.role() = 'service_role');

-- Add idempotency key for replay protection
alter table public.analytics_events add column if not exists idempotency_key text unique;

-- 2. Create Archive Table
create table if not exists public.analytics_events_archive (
  id bigint primary key,
  event_type text not null,
  video_id uuid,
  user_id uuid,
  guest_id text,
  details jsonb not null,
  created_at timestamp with time zone not null,
  idempotency_key text,
  archived_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_analytics_archive_created_at on public.analytics_events_archive(created_at desc);

-- 3. Create Daily Rollups Table
create table if not exists public.analytics_daily_rollups (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  video_id uuid,
  event_type text not null,
  total_events bigint default 0,
  unique_users bigint default 0,
  unique_guests bigint default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(date, video_id, event_type)
);

-- Retention Functions (to be called via pg_cron or external scheduler)

-- A. Rollup Events Function
create or replace function public.rollup_daily_analytics(target_date date)
returns void as $$
begin
  insert into public.analytics_daily_rollups (date, video_id, event_type, total_events, unique_users, unique_guests)
  select 
    target_date as date,
    video_id,
    event_type,
    count(*) as total_events,
    count(distinct user_id) as unique_users,
    count(distinct guest_id) as unique_guests
  from public.analytics_events
  where created_at::date = target_date
  group by video_id, event_type
  on conflict (date, video_id, event_type) 
  do update set 
    total_events = excluded.total_events,
    unique_users = excluded.unique_users,
    unique_guests = excluded.unique_guests;
end;
$$ language plpgsql security definer;

-- B. Archive and Cleanup Function (Runs Daily)
create or replace function public.apply_telemetry_retention()
returns void as $$
begin
  -- 1. Move events older than 30 days to archive
  insert into public.analytics_events_archive (id, event_type, video_id, user_id, guest_id, details, created_at, idempotency_key)
  select id, event_type, video_id, user_id, guest_id, details, created_at, idempotency_key
  from public.analytics_events
  where created_at < now() - interval '30 days'
  on conflict do nothing;

  -- 2. Delete the archived events from main table
  delete from public.analytics_events
  where created_at < now() - interval '30 days';

  -- 3. Delete aggregated events older than 1 year
  delete from public.analytics_daily_rollups
  where date < (now() - interval '1 year')::date;
end;
$$ language plpgsql security definer;
