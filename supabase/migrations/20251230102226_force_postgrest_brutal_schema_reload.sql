/*
  # Force brutal PostgREST schema reload
  
  1. Changes
    - Create and drop temporary table to force complete schema reload
    - Multiple NOTIFY signals
  
  2. Goal
    - Force PostgREST to detect analytics RPC functions
*/

-- Create temporary table
CREATE TABLE IF NOT EXISTS _force_schema_reload (
  id serial PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- Grant access
GRANT ALL ON _force_schema_reload TO anon, authenticated, service_role;

-- Drop it immediately
DROP TABLE IF EXISTS _force_schema_reload CASCADE;

-- Force schema reload with multiple attempts
DO $$
DECLARE
  i integer;
BEGIN
  FOR i IN 1..5 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.1);
  END LOOP;
  
  PERFORM pg_notify('pgrst', 'reload config');
  PERFORM pg_sleep(0.1);
  
  FOR i IN 1..5 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;

-- Add timestamp to functions
COMMENT ON FUNCTION analytics_upsert_session IS 'Analytics upsert session - v2 2025-12-30 10:35';
COMMENT ON FUNCTION analytics_track_page_visit IS 'Analytics track page visit - v2 2025-12-30 10:35';
