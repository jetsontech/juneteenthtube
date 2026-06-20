create index if not exists idx_videos_category_created on videos(category, created_at desc);
create index if not exists idx_videos_state_created on videos(state, created_at desc);
create index if not exists idx_videos_featured_created on videos(is_featured, created_at desc);
create index if not exists idx_videos_trending_created on videos(is_trending, created_at desc);
