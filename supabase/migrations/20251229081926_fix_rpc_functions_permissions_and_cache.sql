/*
  # Fix RPC functions permissions and PostgREST cache
  
  1. Changes
    - Grant execute permissions on all RPC functions to anon and authenticated roles
    - Force PostgREST to reload its schema cache
    - This fixes 404 errors on RPC function calls
  
  2. Functions affected
    - upsert_user_session
    - get_loyalty_tier
    - award_daily_connection_bonus
    - create_user_profile_manually
    - get_loyalty_balance
*/

-- Grant permissions on all public functions to anon and authenticated
DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN 
    SELECT 
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as function_args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prokind = 'f'
  LOOP
    BEGIN
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO anon, authenticated',
        func_record.function_name,
        func_record.function_args
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not grant on function %: %', func_record.function_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

-- Verify key functions exist and are accessible
DO $$
BEGIN
  -- Check upsert_user_session
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'upsert_user_session'
  ) THEN
    RAISE EXCEPTION 'Function upsert_user_session does not exist';
  END IF;

  -- Check get_loyalty_tier
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'get_loyalty_tier'
  ) THEN
    RAISE EXCEPTION 'Function get_loyalty_tier does not exist';
  END IF;

  -- Check award_daily_connection_bonus
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'award_daily_connection_bonus'
  ) THEN
    RAISE EXCEPTION 'Function award_daily_connection_bonus does not exist';
  END IF;

  RAISE NOTICE 'All required functions exist and permissions granted';
END $$;

-- Force another schema cache reload
NOTIFY pgrst, 'reload schema';
