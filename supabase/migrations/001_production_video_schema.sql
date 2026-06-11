create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  thumbnail_url text,
  playback_url text not null,
  duration integer,
  visibility text default 'public',
  views bigint default 0,
  created_at timestamptz default now()
);

create table if not exists watch_history (
  id bigint generated always as identity primary key,
  user_id uuid references profiles(id),
  video_id uuid references videos(id),
  watched_at timestamptz default now(),
  progress_seconds integer default 0
);

create table if not exists subscriptions (
  subscriber_id uuid references profiles(id),
  creator_id uuid references profiles(id),
  created_at timestamptz default now(),
  primary key (subscriber_id, creator_id)
);

create index if not exists videos_created_idx on videos(created_at desc);
create index if not exists videos_views_idx on videos(views desc);

alter table profiles enable row level security;
alter table videos enable row level security;

create policy "Public videos visible"
on videos for select
using (visibility = 'public');
