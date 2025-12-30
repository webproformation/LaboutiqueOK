/*
  # Force PostgREST to detect new RPC functions
  
  1. Changes
    - Add comments to RPC functions to force detection
    - Send NOTIFY signals
  
  2. Goal
    - Make analytics RPC functions visible in PostgREST
*/

-- Add comments to force detection
COMMENT ON FUNCTION analytics_upsert_session IS 'Analytics RPC - upsert session 2025-12-30 10:30';
COMMENT ON FUNCTION analytics_track_page_visit IS 'Analytics RPC - track page visit 2025-12-30 10:30';

-- Force multiple reloads
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_sleep(0.2);
  PERFORM pg_notify('pgrst', 'reload config');
  PERFORM pg_sleep(0.2);
  PERFORM pg_notify('pgrst', 'reload schema');
END $$;
