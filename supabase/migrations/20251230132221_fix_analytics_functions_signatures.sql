/*
  # Fix analytics RPC functions signatures
  
  1. Problem
    - analytics_upsert_session has wrong signature (only accepts p_session_id)
    - API calls it with 3 parameters: p_session_id, p_user_id, p_last_activity
    - Causing 500 errors on /api/analytics
  
  2. Solution
    - Recreate analytics_upsert_session with correct parameters
    - Ensure proper permissions
    - Force PostgREST reload
*/

-- Drop and recreate analytics_upsert_session with correct signature
DROP FUNCTION IF EXISTS analytics_upsert_session(uuid);
DROP FUNCTION IF EXISTS analytics_upsert_session(uuid, uuid, timestamptz);

CREATE OR REPLACE FUNCTION analytics_upsert_session(
  p_session_id uuid,
  p_user_id uuid DEFAULT NULL,
  p_last_activity timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_sessions (session_id, user_id, started_at, last_activity_at)
  VALUES (p_session_id, p_user_id, now(), p_last_activity)
  ON CONFLICT (session_id) 
  DO UPDATE SET 
    user_id = COALESCE(EXCLUDED.user_id, user_sessions.user_id),
    last_activity_at = EXCLUDED.last_activity_at;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION analytics_upsert_session(uuid, uuid, timestamptz) TO anon, authenticated, service_role;

-- Ensure analytics_track_page_visit has proper permissions
GRANT EXECUTE ON FUNCTION analytics_track_page_visit(text, uuid, text) TO anon, authenticated, service_role;

-- Force PostgREST reload
NOTIFY pgrst, 'reload schema';
