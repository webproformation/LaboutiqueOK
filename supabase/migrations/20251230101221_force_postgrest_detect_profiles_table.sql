/*
  # Force PostgREST to detect profiles table
  
  1. Changes
    - Create a view that forces PostgREST to reload the profiles table
    - Add multiple triggers to force detection
  
  2. Goal
    - Make profiles table visible in PostgREST API
*/

-- Drop and recreate a dummy view to force schema reload
DROP VIEW IF EXISTS _force_reload_profiles_view;
CREATE OR REPLACE VIEW _force_reload_profiles_view AS 
SELECT id FROM profiles LIMIT 1;

-- Drop the view immediately
DROP VIEW IF EXISTS _force_reload_profiles_view;

-- Add and remove a trigger to force detection
CREATE OR REPLACE FUNCTION _temp_profiles_trigger()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS _temp_reload_trigger ON profiles;
  CREATE TRIGGER _temp_reload_trigger
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION _temp_profiles_trigger();
  
  DROP TRIGGER IF EXISTS _temp_reload_trigger ON profiles;
END $$;

-- Clean up function
DROP FUNCTION IF EXISTS _temp_profiles_trigger();

-- Force multiple schema reloads
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_sleep(0.2);
  PERFORM pg_notify('pgrst', 'reload config');
  PERFORM pg_sleep(0.2);
  PERFORM pg_notify('pgrst', 'reload schema');
END $$;

-- Update comment with clear timestamp
COMMENT ON TABLE profiles IS 'User profiles - forced PostgREST detection 2025-12-30 10:05';
