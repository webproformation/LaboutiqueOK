/*
  # Force PostgREST cache reload for loyalty_points

  This migration forces PostgREST to reload its schema cache and recognize the updated RLS policies.

  1. Actions taken:
    - Add and remove a temporary column to force schema change detection
    - Send NOTIFY to PostgREST
    - Verify all policies are correct
*/

-- 1. Add temporary column to trigger schema change
DO $$ 
BEGIN
  -- Add a temporary column
  ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS temp_reload_col TEXT DEFAULT NULL;
  
  -- Remove it immediately
  ALTER TABLE loyalty_points DROP COLUMN IF EXISTS temp_reload_col;
  
  RAISE NOTICE 'Schema change triggered for loyalty_points';
END $$;

-- 2. Send multiple NOTIFY signals
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
  RAISE NOTICE 'PostgREST notified to reload';
END $$;

-- 3. Verify policies are in place
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'loyalty_points';
  
  RAISE NOTICE 'Total policies on loyalty_points: %', policy_count;
  
  IF policy_count = 0 THEN
    RAISE EXCEPTION 'No policies found on loyalty_points!';
  END IF;
END $$;

-- 4. Verify RLS is enabled
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'loyalty_points';
  
  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'RLS is not enabled on loyalty_points!';
  END IF;
  
  RAISE NOTICE '✓ RLS is enabled on loyalty_points';
END $$;
