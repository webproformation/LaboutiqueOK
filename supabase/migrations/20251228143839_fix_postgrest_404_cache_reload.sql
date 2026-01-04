/*
  # Force PostgREST Cache Reload - Fix 404 Errors
  
  1. Purpose
    - Force PostgREST to reload its schema cache
    - Fix 404 errors on all table endpoints
    
  2. Actions
    - Send NOTIFY signals to reload schema
    - Refresh pg_catalog
*/

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Execute reload function if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'reload_postgrest_cache') THEN
    PERFORM reload_postgrest_cache();
  END IF;
END $$;
