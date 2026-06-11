-- 1. Video Queries Optimization
create index if not exists idx_videos_created_at on public.videos(created_at desc);
create index if not exists idx_videos_views on public.videos(views desc);
create index if not exists idx_videos_category on public.videos(category);
create index if not exists idx_videos_creator on public.videos(owner_id);

-- 2. Comments Lookup Optimization
create index if not exists idx_comments_video on public.comments(video_id);

-- 3. Likes Tracking Optimization
create index if not exists idx_likes_video on public.likes(video_id);

-- 4. Watch History Slicing Optimization
create index if not exists idx_history_user on public.watch_history(user_id);

-- 5. Trigram GIN Search Index
create extension if not exists pg_trgm;
create index if not exists idx_videos_title_trgm on public.videos using gin (title gin_trgm_ops);
