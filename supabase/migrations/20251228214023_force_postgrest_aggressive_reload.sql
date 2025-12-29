/*
  # Force PostgREST Aggressive Reload
  
  Forces PostgREST to completely reload its schema cache by:
  1. Adding and removing temporary columns to force schema changes
  2. Multiple reload notifications
*/

-- Add temporary columns to force schema detection
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS _tmp_reload1 int DEFAULT 0;
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS _tmp_reload1 int DEFAULT 0;

-- Remove them immediately
ALTER TABLE profiles DROP COLUMN IF EXISTS _tmp_reload1;
ALTER TABLE user_roles DROP COLUMN IF EXISTS _tmp_reload1;

-- Force multiple reloads
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
