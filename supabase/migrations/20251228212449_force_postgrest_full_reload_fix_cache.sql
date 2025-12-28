/*
  # Force PostgREST Full Reload - Fix Cache Corruption
  
  This migration forces PostgREST to fully reload its schema cache by:
  1. Creating a temporary dummy table
  2. Sending reload notification
  3. Dropping the dummy table
  4. Sending another reload notification
*/

-- Create and drop a dummy table to force schema change detection
CREATE TABLE IF NOT EXISTS _force_reload_temp_20251228 (id int);
DROP TABLE IF EXISTS _force_reload_temp_20251228;

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
