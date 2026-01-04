/*
  # Force brutal PostgREST cache reload

  This migration forces PostgREST to completely reload its cache by:
  - Making schema changes to all affected tables
  - Sending multiple NOTIFY signals
  - Verifying the final state

  1. Actions:
    - Schema modifications on loyalty_points, user_sessions, page_visits
    - Multiple NOTIFY signals
    - Verification of RLS and policies
*/

-- 1. Force schema changes on all three tables
DO $$ 
BEGIN
  -- loyalty_points
  ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS force_reload_3 TEXT DEFAULT NULL;
  ALTER TABLE loyalty_points DROP COLUMN IF EXISTS force_reload_3;
  
  -- user_sessions
  ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS force_reload_3 TEXT DEFAULT NULL;
  ALTER TABLE user_sessions DROP COLUMN IF EXISTS force_reload_3;
  
  -- page_visits
  ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS force_reload_3 TEXT DEFAULT NULL;
  ALTER TABLE page_visits DROP COLUMN IF EXISTS force_reload_3;
  
  RAISE NOTICE '✓ Schema changes applied to all tables';
END $$;

-- 2. Send multiple NOTIFY signals with delays
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_sleep(0.1);
  PERFORM pg_notify('pgrst', 'reload config');
  PERFORM pg_sleep(0.1);
  PERFORM pg_notify('pgrst', 'reload schema');
  RAISE NOTICE '✓ Multiple NOTIFY signals sent';
END $$;

-- 3. Verify RLS is enabled on all tables
DO $$
DECLARE
  loyalty_rls BOOLEAN;
  sessions_rls BOOLEAN;
  visits_rls BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO loyalty_rls FROM pg_class WHERE relname = 'loyalty_points';
  SELECT relrowsecurity INTO sessions_rls FROM pg_class WHERE relname = 'user_sessions';
  SELECT relrowsecurity INTO visits_rls FROM pg_class WHERE relname = 'page_visits';
  
  IF NOT loyalty_rls OR NOT sessions_rls OR NOT visits_rls THEN
    RAISE EXCEPTION 'RLS not enabled on all tables!';
  END IF;
  
  RAISE NOTICE '✓ RLS enabled on all tables';
END $$;

-- 4. Verify policy counts
DO $$
DECLARE
  loyalty_count INTEGER;
  sessions_count INTEGER;
  visits_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO loyalty_count FROM pg_policies WHERE tablename = 'loyalty_points';
  SELECT COUNT(*) INTO sessions_count FROM pg_policies WHERE tablename = 'user_sessions';
  SELECT COUNT(*) INTO visits_count FROM pg_policies WHERE tablename = 'page_visits';
  
  RAISE NOTICE '✓ Final policy counts:';
  RAISE NOTICE '  - loyalty_points: % policies', loyalty_count;
  RAISE NOTICE '  - user_sessions: % policies', sessions_count;
  RAISE NOTICE '  - page_visits: % policies', visits_count;
  
  IF loyalty_count = 0 OR sessions_count = 0 OR visits_count = 0 THEN
    RAISE EXCEPTION 'Missing policies on one or more tables!';
  END IF;
END $$;

-- 5. Create a temporary view to force PostgREST to re-scan
CREATE OR REPLACE VIEW postgrest_force_reload_v3 AS
SELECT 
  'loyalty_points' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'loyalty_points'
UNION ALL
SELECT 
  'user_sessions' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'user_sessions'
UNION ALL
SELECT 
  'page_visits' as table_name,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'page_visits';

-- 6. Drop the view immediately
DROP VIEW IF EXISTS postgrest_force_reload_v3;

-- 7. Final NOTIFY
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  RAISE NOTICE '✓ Final NOTIFY sent';
END $$;
