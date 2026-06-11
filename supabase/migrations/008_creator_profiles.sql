-- Add advanced creator profile fields
alter table public.profiles
add column if not exists banner_url text,
add column if not exists links jsonb default '[]'::jsonb,
add column if not exists is_verified boolean default false,
add column if not exists status text default 'active', -- active, suspended, pending
add column if not exists trust_score integer default 100;

-- Create a secure view for the Creator Analytics Dashboard
create or replace view public.creator_analytics_dashboard as
select 
  v.creator_id,
  count(distinct v.id) as total_videos,
  coalesce(sum(v.views), 0) as total_views,
  coalesce(sum(v.duration * v.views), 0) as estimated_watch_time_seconds, -- simplified watch time
  (select count(*) from public.subscriptions s where s.creator_id = v.creator_id) as total_subscribers,
  coalesce((select count(*) from public.likes l where l.video_id in (select id from public.videos where creator_id = v.creator_id)), 0) as total_engagement,
  100 as retention_rate_percent, -- Placeholder for complex aggregation
  100 as completion_rate_percent, -- Placeholder for complex aggregation
  0 as month_over_month_growth -- Placeholder for time-series growth
from public.videos v
group by v.creator_id;

-- Add RLS to allow creators to read only their own analytics
-- Views do not support RLS directly unless they are security invoker views or we use a function.
-- Since Supabase uses PostgREST, we can create a function that returns the analytics for the current user.
create or replace function public.get_my_creator_analytics()
returns setof public.creator_analytics_dashboard
language sql security definer
as $$
  select * from public.creator_analytics_dashboard
  where creator_id = auth.uid();
$$;
