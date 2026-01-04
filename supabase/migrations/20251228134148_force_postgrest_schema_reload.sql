/*
  # Force PostgREST Schema Cache Reload

  1. Purpose
    - Force PostgREST to completely rebuild its schema cache
    - Ensure all tables are visible to the anon role
    - Fix 404 errors on all API endpoints

  2. Actions
    - Revoke and re-grant all permissions to anon role
    - Send multiple NOTIFY signals to PostgREST
    - Force a complete schema cache invalidation
*/

-- Step 1: Revoke all permissions from anon
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON %I.%I FROM anon', r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Step 2: Re-grant SELECT permission to anon for all tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('GRANT SELECT ON %I.%I TO anon', r.schemaname, r.tablename);
  END LOOP;
END $$;

-- Step 3: Re-grant USAGE on all sequences
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, sequencename 
    FROM pg_sequences 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('GRANT USAGE ON SEQUENCE %I.%I TO anon', r.schemaname, r.sequencename);
  END LOOP;
END $$;

-- Step 4: Grant EXECUTE on all functions to anon
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT n.nspname as schema, p.proname as function
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I TO anon', r.schema, r.function);
  END LOOP;
END $$;

-- Step 5: Send NOTIFY signals
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Step 6: Create a function that can be called to reload the cache
CREATE OR REPLACE FUNCTION reload_postgrest_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
  NOTIFY pgrst, 'reload config';
END;
$$;

-- Grant execute to anon
GRANT EXECUTE ON FUNCTION reload_postgrest_cache() TO anon;

-- Execute the reload
SELECT reload_postgrest_cache();
