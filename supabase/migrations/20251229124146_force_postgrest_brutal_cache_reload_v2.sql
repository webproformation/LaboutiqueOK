/*
  # Force PostgREST to reload cache - Production database
  
  This migration forces PostgREST to detect schema changes and reload its cache
*/

-- Send multiple reload signals to PostgREST
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Make a visible schema change to force detection
DO $$
BEGIN
  -- Add a comment with timestamp to force schema change detection
  EXECUTE format('COMMENT ON SCHEMA public IS %L', 'Reloaded at ' || now());
END $$;

-- Notify again after schema change
NOTIFY pgrst, 'reload schema';