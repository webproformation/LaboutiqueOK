/*
  # Create analytics RPC helper functions
  
  1. Changes
    - Create new RPC functions for analytics with different names
    - Bypass PostgREST cache issues with direct SQL
  
  2. Goal
    - Allow analytics API to work despite cache problems
*/

-- Create RPC function to upsert analytics session
CREATE OR REPLACE FUNCTION analytics_upsert_session(
  p_session_id text,
  p_user_id uuid DEFAULT NULL,
  p_last_activity timestamptz DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_uuid uuid;
  v_result jsonb;
BEGIN
  -- Convert session_id to UUID if possible
  BEGIN
    v_session_uuid := p_session_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_session_uuid := gen_random_uuid();
  END;
  
  -- Try to update existing session
  UPDATE user_sessions
  SET 
    last_activity_at = p_last_activity,
    user_id = COALESCE(p_user_id, user_id)
  WHERE session_id = v_session_uuid;
  
  -- If no session exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_sessions (
      session_id,
      user_id,
      started_at,
      last_activity_at,
      total_pages_viewed
    ) VALUES (
      v_session_uuid,
      p_user_id,
      p_last_activity,
      p_last_activity,
      0
    );
  END IF;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Create RPC function to track analytics page visit
CREATE OR REPLACE FUNCTION analytics_track_page_visit(
  p_session_id text,
  p_user_id uuid DEFAULT NULL,
  p_page_path text DEFAULT '/'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_uuid uuid;
BEGIN
  -- Convert session_id to UUID
  BEGIN
    v_session_uuid := p_session_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid session ID');
  END;
  
  -- Insert page visit
  INSERT INTO page_visits (
    session_id,
    user_id,
    page_path,
    visited_at
  ) VALUES (
    v_session_uuid,
    p_user_id,
    p_page_path,
    now()
  );
  
  -- Update session
  UPDATE user_sessions
  SET 
    total_pages_viewed = COALESCE(total_pages_viewed, 0) + 1,
    last_activity_at = now()
  WHERE session_id = v_session_uuid;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Grant execute to all roles
GRANT EXECUTE ON FUNCTION analytics_upsert_session TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION analytics_track_page_visit TO anon, authenticated, service_role;
