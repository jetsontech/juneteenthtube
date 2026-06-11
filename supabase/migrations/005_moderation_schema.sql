-- Create Moderation Reports Table
create table if not exists public.moderation_reports (
  id uuid default gen_random_uuid() primary key,
  video_id uuid references public.videos(id) on delete cascade not null,
  reporter_id uuid references auth.users(id) on delete set null,
  reason text not null check (reason in ('spam', 'copyright', 'harassment', 'hate speech', 'misinformation', 'graphic content', 'other')),
  details text,
  status text default 'pending' not null check (status in ('pending', 'reviewed', 'dismissed', 'escalated')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for moderation_reports
alter table public.moderation_reports enable row level security;

create policy "Anyone can insert reports" 
on public.moderation_reports for insert with check (true);

create policy "Only admins can select reports" 
on public.moderation_reports for select using (
  auth.role() = 'service_role' or (auth.uid() is not null and exists (
    select 1 from auth.users 
    where id = auth.uid() 
    and (raw_user_meta_data->>'role' = 'admin' or email = 'admin@example.com')
  ))
);

-- Create Moderation Actions (Audit Trail) Table
create table if not exists public.moderation_actions (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references auth.users(id) on delete set null,
  target_video_id uuid references public.videos(id) on delete cascade not null,
  target_creator_id uuid, -- Reference to the video owner for warning/suspend checks
  action text not null check (action in ('dismiss', 'remove_content', 'warn_creator', 'suspend_creator', 'ban_creator', 'escalate_review')),
  reason text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for moderation_actions
alter table public.moderation_actions enable row level security;

create policy "Only admins can insert/select actions" 
on public.moderation_actions for all using (
  auth.role() = 'service_role' or (auth.uid() is not null and exists (
    select 1 from auth.users 
    where id = auth.uid() 
    and (raw_user_meta_data->>'role' = 'admin' or email = 'admin@example.com')
  ))
);

-- Create Moderation Notes Table
create table if not exists public.moderation_notes (
  id uuid default gen_random_uuid() primary key,
  report_id uuid references public.moderation_reports(id) on delete cascade not null,
  admin_id uuid references auth.users(id) on delete set null,
  note text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for moderation_notes
alter table public.moderation_notes enable row level security;

create policy "Only admins can insert/select notes" 
on public.moderation_notes for all using (
  auth.role() = 'service_role' or (auth.uid() is not null and exists (
    select 1 from auth.users 
    where id = auth.uid() 
    and (raw_user_meta_data->>'role' = 'admin' or email = 'admin@example.com')
  ))
);

-- High-performance indexes for moderation searches
create index if not exists idx_reports_status on public.moderation_reports(status);
create index if not exists idx_reports_video_id on public.moderation_reports(video_id);
create index if not exists idx_actions_target_video_id on public.moderation_actions(target_video_id);
