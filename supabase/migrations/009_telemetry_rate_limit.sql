create table if not exists telemetry_rate_limits (
  key text,
  window_start timestamptz,
  window_type text,
  count int default 0,
  primary key (key, window_start, window_type)
);
