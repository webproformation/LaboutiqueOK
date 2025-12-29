/*
  # Force PostgREST Brutal Schema Reload

  1. Problem
    - PostgREST cache is completely stuck
    - Functions exist in DB but return 404
    - Tables return 400 errors
    
  2. Solution
    - Drop and recreate a dummy table to force schema version change
    - Change multiple schema attributes
    - Use all NOTIFY methods
    - Add a view that references RPC functions
*/

-- ============================================================================
-- 1. CREATE TEMPORARY SCHEMA OBJECTS TO FORCE RELOAD
-- ============================================================================

-- Create a temporary table
CREATE TABLE IF NOT EXISTS _postgrest_reload_trigger_20251229_1145 (
  id SERIAL PRIMARY KEY,
  reload_time TIMESTAMPTZ DEFAULT now()
);

-- Insert a row
INSERT INTO _postgrest_reload_trigger_20251229_1145 DEFAULT VALUES;

-- Drop it immediately (this changes schema version)
DROP TABLE _postgrest_reload_trigger_20251229_1145;

-- ============================================================================
-- 2. MODIFY SCHEMA COMMENTS TO FORCE DETECTION
-- ============================================================================

COMMENT ON SCHEMA public IS 'RELOAD FORCED AT 2025-12-29 11:45:00 UTC - Cache invalidation v3';

-- ============================================================================
-- 3. RECREATE A VIEW THAT REFERENCES RPC FUNCTIONS
-- ============================================================================

-- This forces PostgREST to re-examine the schema
CREATE OR REPLACE VIEW _postgrest_function_check AS
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname IN ('upsert_user_session', 'get_user_role', 'get_loyalty_tier', 'award_daily_connection_bonus');

-- ============================================================================
-- 4. SEND MULTIPLE NOTIFY SIGNALS
-- ============================================================================

-- Method 1: Standard reload
NOTIFY pgrst, 'reload schema';

-- Method 2: Config reload
NOTIFY pgrst, 'reload config';

-- Method 3: Multiple notifications
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
END $$;

-- ============================================================================
-- 5. ALTER FUNCTION COMMENTS TO CHANGE METADATA
-- ============================================================================

COMMENT ON FUNCTION get_user_role(UUID) IS 'Returns the role of a user - Updated 2025-12-29 11:45';
COMMENT ON FUNCTION upsert_user_session(TEXT, UUID, TEXT, TEXT, TEXT) IS 'Upserts user session - Updated 2025-12-29 11:45';
COMMENT ON FUNCTION get_loyalty_tier(UUID) IS 'Returns loyalty tier - Updated 2025-12-29 11:45';
COMMENT ON FUNCTION award_daily_connection_bonus(UUID) IS 'Awards daily bonus - Updated 2025-12-29 11:45';

-- ============================================================================
-- 6. REVOKE AND RE-GRANT PERMISSIONS (forces ACL change detection)
-- ============================================================================

-- Revoke all
REVOKE ALL ON FUNCTION get_user_role(UUID) FROM anon, authenticated, service_role;
REVOKE ALL ON FUNCTION upsert_user_session(TEXT, UUID, TEXT, TEXT, TEXT) FROM anon, authenticated, service_role;
REVOKE ALL ON FUNCTION get_loyalty_tier(UUID) FROM anon, authenticated, service_role;
REVOKE ALL ON FUNCTION award_daily_connection_bonus(UUID) FROM anon, authenticated, service_role;

-- Re-grant
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION upsert_user_session(TEXT, UUID, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_loyalty_tier(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION award_daily_connection_bonus(UUID) TO anon, authenticated, service_role;

-- ============================================================================
-- 7. ALTER TABLES TO TRIGGER SCHEMA CHANGE
-- ============================================================================

-- Add a temporary column to a table and remove it
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS _temp_reload_col TEXT;
ALTER TABLE user_roles DROP COLUMN IF EXISTS _temp_reload_col;

-- ============================================================================
-- 8. FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE
  func_count INT;
BEGIN
  SELECT COUNT(*) INTO func_count
  FROM pg_proc 
  WHERE proname IN ('upsert_user_session', 'get_user_role', 'get_loyalty_tier', 'award_daily_connection_bonus');
  
  IF func_count < 4 THEN
    RAISE EXCEPTION 'Missing functions! Found only %', func_count;
  END IF;
  
  RAISE NOTICE '✓ All 4 functions verified';
  RAISE NOTICE '✓ PostgREST reload triggered with multiple methods';
  RAISE NOTICE '✓ Schema version changed';
  RAISE NOTICE '✓ Wait 30-60 seconds for PostgREST to reload';
END $$;
