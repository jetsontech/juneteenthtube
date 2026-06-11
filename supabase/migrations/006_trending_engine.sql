-- Create Weighted Trending Videos View utilizing dynamic gravity time decay
create or replace view public.weighted_trending_videos as
select 
  v.id,
  v.title,
  v.category,
  v.views,
  v.owner_id,
  v.created_at,
  v.thumbnail_url,
  v.video_url,
  v.video_url_h264,
  v.channel_name,
  v.channel_avatar,
  v.duration,
  v.transcode_status,
  v.is_featured,
  v.is_trending,
  -- Scoring algorithm: (Views * 0.2 + Likes * 3.0 + Comments * 5.0) / (Age in Hours + 2)^1.5
  (
    (coalesce(v.views, 0) * 0.2) +
    ((select count(*) from public.likes l where l.video_id = v.id and l.type = 'like') * 3.0) +
    ((select count(*) from public.comments c where c.video_id = v.id) * 5.0)
  ) / 
  power((extract(epoch from (now() - v.created_at)) / 3600) + 2.0, 1.5) as trending_score
from public.videos v
where v.transcode_status = 'completed' or v.transcode_status is null
order by trending_score desc;

-- Grant select on weighted_trending_videos
grant select on public.weighted_trending_videos to service_role;
grant select on public.weighted_trending_videos to authenticated;
grant select on public.weighted_trending_videos to anon;

-- Create Related Videos Recommendation View (Deterministic same-creator & same-category scoring)
create or replace view public.video_recommendations as
select 
  v.id as target_video_id,
  r.id as recommended_video_id,
  r.title as recommended_title,
  r.category as recommended_category,
  r.thumbnail_url as recommended_thumbnail,
  r.channel_name as recommended_channel,
  -- Score matching: +10 points for same creator, +5 points for same category
  (case when r.owner_id = v.owner_id then 10.0 else 0.0 end) +
  (case when r.category = v.category then 5.0 else 0.0 end) +
  (coalesce(r.views, 0) * 0.01) as match_score
from public.videos v
join public.videos r on v.id != r.id
where r.transcode_status = 'completed' or r.transcode_status is null;

-- Grant select on video_recommendations
grant select on public.video_recommendations to service_role;
grant select on public.video_recommendations to authenticated;
grant select on public.video_recommendations to anon;
