/*
  # Fix loyalty_points and analytics errors

  1. Clean up duplicate RLS policies on loyalty_points
  2. Create simple permissive policies
  3. Drop and recreate analytics RPC functions
  4. Force PostgREST schema reload
*/

-- Drop all existing policies on loyalty_points
DROP POLICY IF EXISTS "loyalty_points_select_all" ON loyalty_points;
DROP POLICY IF EXISTS "loyalty_points_insert_service" ON loyalty_points;
DROP POLICY IF EXISTS "loyalty_points_update_service" ON loyalty_points;
DROP POLICY IF EXISTS "Allow all to read loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "Allow authenticated to insert own loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "System can manage all loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "Allow service_role to insert loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "Allow service_role to update loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "Allow service_role to delete loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "allow_all_select" ON loyalty_points;
DROP POLICY IF EXISTS "allow_all_insert" ON loyalty_points;

-- Create simple permissive policies for loyalty_points
CREATE POLICY "loyalty_points_public_select"
  ON loyalty_points
  FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

CREATE POLICY "loyalty_points_public_insert"
  ON loyalty_points
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

CREATE POLICY "loyalty_points_public_update"
  ON loyalty_points
  FOR UPDATE
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "loyalty_points_public_delete"
  ON loyalty_points
  FOR DELETE
  TO anon, authenticated, service_role
  USING (true);

-- Drop existing analytics functions
DROP FUNCTION IF EXISTS analytics_upsert_session(TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS analytics_track_page_visit(TEXT, UUID, TEXT);

-- Recreate analytics RPC functions with correct signatures
CREATE OR REPLACE FUNCTION analytics_upsert_session(
  p_session_id TEXT,
  p_user_id UUID DEFAULT NULL,
  p_last_activity TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_sessions (
    session_id,
    user_id,
    last_activity_at
  ) VALUES (
    p_session_id,
    p_user_id,
    COALESCE(p_last_activity::timestamptz, now())
  )
  ON CONFLICT (session_id)
  DO UPDATE SET
    user_id = COALESCE(EXCLUDED.user_id, user_sessions.user_id),
    last_activity_at = COALESCE(EXCLUDED.last_activity_at, now());
END;
$$;

CREATE OR REPLACE FUNCTION analytics_track_page_visit(
  p_session_id TEXT,
  p_user_id UUID DEFAULT NULL,
  p_page_path TEXT DEFAULT '/'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert session first
  PERFORM analytics_upsert_session(p_session_id, p_user_id, now()::text);
  
  -- Insert page visit
  INSERT INTO page_visits (
    session_id,
    user_id,
    page_path,
    visited_at
  ) VALUES (
    p_session_id,
    p_user_id,
    p_page_path,
    now()
  );
END;
$$;

-- Grant execute permissions to all roles
GRANT EXECUTE ON FUNCTION analytics_upsert_session(TEXT, UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION analytics_track_page_visit(TEXT, UUID, TEXT) TO anon, authenticated, service_role;

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
