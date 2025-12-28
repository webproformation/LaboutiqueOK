/*
  # Force Complete PostgREST Schema Reload - Fix 404 Errors
  
  1. Purpose
    - Aggressively force PostgREST to reload its entire schema cache
    - Fix 404 errors on all table endpoints in production
    
  2. Actions
    - Send multiple NOTIFY signals
    - Update pg_catalog statistics
    - Force schema visibility refresh
    - Ensure all tables are visible to anon/authenticated roles
*/

-- 1. Force PostgREST schema reload with multiple signals
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 2. Refresh schema cache metadata
DO $$
BEGIN
  -- Update pg_catalog statistics
  ANALYZE;
  
  -- Force schema visibility
  PERFORM pg_notify('pgrst', 'reload schema');
  
  -- Log reload
  RAISE NOTICE 'PostgREST schema reload forced at %', now();
END $$;

-- 3. Ensure all tables have proper grants for anon/authenticated
DO $$
DECLARE
  tbl record;
BEGIN
  FOR tbl IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    -- Grant SELECT to anon and authenticated on all tables
    EXECUTE format('GRANT SELECT ON TABLE %I.%I TO anon', tbl.schemaname, tbl.tablename);
    EXECUTE format('GRANT SELECT ON TABLE %I.%I TO authenticated', tbl.schemaname, tbl.tablename);
  END LOOP;
END $$;

-- 4. Ensure all RPC functions are visible
DO $$
DECLARE
  func record;
BEGIN
  FOR func IN 
    SELECT n.nspname as schema, p.proname as function
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
  LOOP
    -- Grant EXECUTE to anon and authenticated on all functions
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I TO anon', func.schema, func.function);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I TO authenticated', func.schema, func.function);
  END LOOP;
END $$;

-- 5. Final reload signal
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- 6. Output confirmation
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'PostgREST FORCED RELOAD COMPLETED';
  RAISE NOTICE 'All tables and functions visibility refreshed';
  RAISE NOTICE 'Time: %', now();
  RAISE NOTICE '================================================';
END $$;
