/*
  # Force PostgREST brutal cache reload for loyalty_points
  
  1. Changes
    - Add/remove a temporary column to force schema change detection
    - Add comment to force reload
    - Send multiple NOTIFY signals
  
  2. Goal
    - Force PostgREST to completely reload the loyalty_points table schema
*/

-- Add temporary column
ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS _temp_reload_trigger text DEFAULT NULL;

-- Remove it immediately
ALTER TABLE loyalty_points DROP COLUMN IF EXISTS _temp_reload_trigger;

-- Force multiple notifications
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
  PERFORM pg_sleep(0.1);
  PERFORM pg_notify('pgrst', 'reload schema');
END $$;

-- Update comment with timestamp
COMMENT ON TABLE loyalty_points IS 'Loyalty points - forced cache reload 2025-12-30 02:35';

-- Verify RLS is enabled
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'loyalty_points') THEN
    RAISE EXCEPTION 'RLS is not enabled on loyalty_points';
  END IF;
  RAISE NOTICE 'RLS enabled on loyalty_points';
  RAISE NOTICE 'PostgREST cache reload triggered';
END $$;
