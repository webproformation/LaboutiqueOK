/*
  # Fix user sessions upsert to avoid 409 conflicts

  1. Changes
    - Create a PostgreSQL function to handle session upsert with ON CONFLICT
    - This avoids race conditions and 409 errors when multiple requests try to create the same session
    - The function preserves the original started_at timestamp on updates

  2. Security
    - Function uses SECURITY DEFINER to bypass RLS for this specific operation
    - Only allows insert/update of sessions, no deletion
*/

CREATE OR REPLACE FUNCTION upsert_user_session(
  p_session_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  INSERT INTO user_sessions (session_id, user_id, started_at, last_activity_at)
  VALUES (p_session_id, p_user_id, now(), now())
  ON CONFLICT (session_id) 
  DO UPDATE SET 
    last_activity_at = now(),
    user_id = COALESCE(EXCLUDED.user_id, user_sessions.user_id)
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$;