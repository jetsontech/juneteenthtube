-- Migration: Create atomic rate limiting function for database-backed rate limiting fallback
create or replace function increment_telemetry_rate_limit(
  p_key text,
  p_window_start timestamptz,
  p_window_type text
) returns int as $$
declare
  v_count int;
begin
  insert into telemetry_rate_limits (key, window_start, window_type, count)
  values (p_key, p_window_start, p_window_type, 1)
  on conflict (key, window_start, window_type)
  do update set count = telemetry_rate_limits.count + 1
  returning count into v_count;
  return v_count;
end;
$$ language plpgsql security definer;
