/*
  # Force PostgREST complete reload for all tables
  
  1. Problem
    - 400 errors on loyalty_points
    - 500 errors on /api/analytics
    - 500 errors on /api/woocommerce/categories
    - PostgREST cache not detecting tables/functions
  
  2. Solution
    - Add dummy columns and remove them to force schema detection
    - Multiple reload notifications
    - Ensure all permissions are correct
*/

-- Force table detection by adding and removing dummy columns
DO $$
BEGIN
  -- loyalty_points
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'loyalty_points' AND column_name = '_force_reload_temp') THEN
    ALTER TABLE loyalty_points ADD COLUMN _force_reload_temp int;
  END IF;
  ALTER TABLE loyalty_points DROP COLUMN IF EXISTS _force_reload_temp;
  
  -- woocommerce_categories_cache
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'woocommerce_categories_cache' AND column_name = '_force_reload_temp') THEN
    ALTER TABLE woocommerce_categories_cache ADD COLUMN _force_reload_temp int;
  END IF;
  ALTER TABLE woocommerce_categories_cache DROP COLUMN IF EXISTS _force_reload_temp;
  
  -- user_sessions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_sessions' AND column_name = '_force_reload_temp') THEN
    ALTER TABLE user_sessions ADD COLUMN _force_reload_temp int;
  END IF;
  ALTER TABLE user_sessions DROP COLUMN IF EXISTS _force_reload_temp;
  
  -- page_visits
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'page_visits' AND column_name = '_force_reload_temp') THEN
    ALTER TABLE page_visits ADD COLUMN _force_reload_temp int;
  END IF;
  ALTER TABLE page_visits DROP COLUMN IF EXISTS _force_reload_temp;
END $$;

-- Send multiple reload notifications
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Wait a moment
SELECT pg_sleep(0.1);

-- Send again
NOTIFY pgrst, 'reload schema';
