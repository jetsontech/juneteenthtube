-- Create Playback Events View for optimized dashboard queries
create or replace view public.playback_events as
select 
  id,
  event_type,
  video_id,
  user_id,
  guest_id,
  details,
  created_at
from public.analytics_events
where event_type in (
  'playback_start', 
  'playback_stop', 
  'buffering_start', 
  'buffering_end', 
  'playback_error', 
  'quality_change', 
  'abandonment', 
  'watch_complete'
);

-- Grant select on playback_events
grant select on public.playback_events to service_role;
grant select on public.playback_events to authenticated;

-- Create Upload Events View for creator dashboard tracking
create or replace view public.upload_events as
select 
  id,
  event_type,
  video_id,
  user_id,
  guest_id,
  details,
  created_at
from public.analytics_events
where event_type in (
  'upload_start', 
  'upload_complete', 
  'upload_error', 
  'transcode_start', 
  'transcode_complete', 
  'thumbnail_gen'
);

-- Grant select on upload_events
grant select on public.upload_events to service_role;
grant select on public.upload_events to authenticated;
