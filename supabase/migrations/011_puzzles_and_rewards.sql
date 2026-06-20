-- Migration: Create gamification and puzzle progress schema for launch MVP

-- Track user points, level, and XP
create table if not exists cq_points (
    id bigint generated always as identity primary key,
    user_id text unique,
    points integer default 0,
    level integer default 1,
    updated_at timestamptz default now()
);

-- Track user achievements unlocked
create table if not exists cq_achievements (
    id bigint generated always as identity primary key,
    user_id text,
    achievement text,
    created_at timestamptz default now()
);

-- Track completed puzzles
create table if not exists cq_puzzle_progress (
    id bigint generated always as identity primary key,
    user_id text,
    puzzle_id text,
    completed boolean default false,
    score integer default 0,
    created_at timestamptz default now(),
    unique (user_id, puzzle_id)
);

-- Create index for quick lookups on user_id
create index if not exists idx_cq_points_user on cq_points(user_id);
create index if not exists idx_cq_achievements_user on cq_achievements(user_id);
create index if not exists idx_cq_puzzle_progress_user on cq_puzzle_progress(user_id);
