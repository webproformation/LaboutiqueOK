/*
  # Recreate All RPC Functions and Fix PostgREST Cache

  1. Problem
    - get_user_role function does not exist at all
    - Other functions have different signatures
    - PostgREST cache is stale (404 errors on all RPC calls)
    
  2. Solution
    - Drop existing functions with exact signatures
    - Recreate all functions with correct signatures
    - Grant permissions to all roles
    - Force PostgREST reload
    
  3. Functions
    - get_user_role(user_id UUID) - Returns user role
    - upsert_user_session(...) - Updates user session
    - get_loyalty_tier(user_id UUID) - Returns loyalty tier
    - award_daily_connection_bonus(user_id UUID) - Awards daily bonus
*/

-- ============================================================================
-- 1. DROP EXISTING FUNCTIONS WITH EXACT SIGNATURES
-- ============================================================================

DROP FUNCTION IF EXISTS upsert_user_session(p_session_id uuid, p_user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS get_loyalty_tier(p_user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS award_daily_connection_bonus(p_user_id uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_user_role() CASCADE;

-- ============================================================================
-- 2. CREATE get_user_role FUNCTION (was missing!)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role(p_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  target_user_id UUID;
  user_role TEXT;
BEGIN
  -- Use provided user_id or current authenticated user
  target_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Return 'anonymous' if no user
  IF target_user_id IS NULL THEN
    RETURN 'anonymous';
  END IF;

  -- Check user_roles table
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = target_user_id
  LIMIT 1;

  -- Return role or default to 'customer'
  RETURN COALESCE(user_role, 'customer');
END;
$$;

-- ============================================================================
-- 3. RECREATE upsert_user_session FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION upsert_user_session(
  p_session_id TEXT,
  p_user_id UUID DEFAULT NULL,
  p_page_path TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
  v_user_id UUID;
BEGIN
  -- Use provided user_id or current user
  v_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Upsert session
  INSERT INTO user_sessions (
    user_id,
    session_id,
    last_page_path,
    user_agent,
    ip_address,
    last_seen_at
  )
  VALUES (
    v_user_id,
    p_session_id,
    p_page_path,
    p_user_agent,
    p_ip_address,
    now()
  )
  ON CONFLICT (session_id)
  DO UPDATE SET
    last_page_path = COALESCE(EXCLUDED.last_page_path, user_sessions.last_page_path),
    user_agent = COALESCE(EXCLUDED.user_agent, user_sessions.user_agent),
    ip_address = COALESCE(EXCLUDED.ip_address, user_sessions.ip_address),
    last_seen_at = now()
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- ============================================================================
-- 4. RECREATE get_loyalty_tier FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_loyalty_tier(p_user_id UUID DEFAULT NULL)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  target_user_id UUID;
  user_points INTEGER;
BEGIN
  -- Use provided user_id or current user
  target_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Return default tier if no user
  IF target_user_id IS NULL THEN
    RETURN 'bronze';
  END IF;

  -- Get user's total points
  SELECT COALESCE(SUM(points), 0) INTO user_points
  FROM loyalty_points
  WHERE user_id = target_user_id;

  -- Determine tier based on points
  IF user_points >= 5000 THEN
    RETURN 'diamond';
  ELSIF user_points >= 2000 THEN
    RETURN 'gold';
  ELSIF user_points >= 500 THEN
    RETURN 'silver';
  ELSE
    RETURN 'bronze';
  END IF;
END;
$$;

-- ============================================================================
-- 5. RECREATE award_daily_connection_bonus FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION award_daily_connection_bonus(p_user_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  last_bonus_date DATE;
  bonus_points INTEGER := 10;
  was_awarded BOOLEAN := FALSE;
BEGIN
  -- Use provided user_id or current user
  target_user_id := COALESCE(p_user_id, auth.uid());
  
  -- Check if user is authenticated
  IF target_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not authenticated',
      'points', 0,
      'awarded', false
    );
  END IF;

  -- Check when user last received daily bonus
  SELECT MAX(created_at::DATE) INTO last_bonus_date
  FROM loyalty_points
  WHERE user_id = target_user_id
    AND action = 'daily_connection';

  -- Award bonus if not already received today
  IF last_bonus_date IS NULL OR last_bonus_date < CURRENT_DATE THEN
    INSERT INTO loyalty_points (user_id, points, action, description)
    VALUES (
      target_user_id,
      bonus_points,
      'daily_connection',
      'Bonus de connexion quotidien'
    );
    
    was_awarded := TRUE;
  END IF;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'points', bonus_points,
    'awarded', was_awarded,
    'message', CASE 
      WHEN was_awarded THEN 'Bonus awarded successfully'
      ELSE 'Bonus already claimed today'
    END
  );
END;
$$;

-- ============================================================================
-- 6. GRANT EXECUTE PERMISSIONS TO ALL ROLES
-- ============================================================================

-- Grant to anonymous users
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO anon;
GRANT EXECUTE ON FUNCTION upsert_user_session(TEXT, UUID, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_loyalty_tier(UUID) TO anon;
GRANT EXECUTE ON FUNCTION award_daily_connection_bonus(UUID) TO anon;

-- Grant to authenticated users
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_user_session(TEXT, UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_loyalty_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION award_daily_connection_bonus(UUID) TO authenticated;

-- Grant to service role
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION upsert_user_session(TEXT, UUID, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION get_loyalty_tier(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION award_daily_connection_bonus(UUID) TO service_role;

-- ============================================================================
-- 7. FORCE AGGRESSIVE POSTGREST SCHEMA RELOAD
-- ============================================================================

-- Notify PostgREST to reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Change schema to force reload
COMMENT ON SCHEMA public IS 'Schema reloaded at 2025-12-29 11:35:00 UTC';

-- Create and drop a temporary object to bump schema version
CREATE TABLE IF NOT EXISTS _force_schema_reload_temp (id INT);
DROP TABLE IF EXISTS _force_schema_reload_temp;

-- ============================================================================
-- 8. VERIFY ALL FUNCTIONS WERE CREATED
-- ============================================================================

DO $$
DECLARE
  function_count INT;
BEGIN
  -- Count created functions
  SELECT COUNT(*) INTO function_count
  FROM pg_proc
  WHERE proname IN (
    'get_user_role',
    'upsert_user_session',
    'get_loyalty_tier',
    'award_daily_connection_bonus'
  );

  IF function_count < 4 THEN
    RAISE EXCEPTION 'Not all functions were created! Found: %', function_count;
  END IF;

  RAISE NOTICE '✓ All 4 RPC functions created successfully';
  RAISE NOTICE '✓ Permissions granted to anon, authenticated, and service_role';
  RAISE NOTICE '✓ PostgREST reload triggered';
END $$;
