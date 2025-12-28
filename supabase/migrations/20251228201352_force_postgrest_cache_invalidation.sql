/*
  # Force PostgREST Cache Invalidation
  
  Force PostgREST to reload specific tables by making trivial schema changes.
*/

-- Force reload de weekly_ambassadors en ajoutant un commentaire
COMMENT ON COLUMN weekly_ambassadors.week_start_date IS 'Start date of the week';
COMMENT ON COLUMN weekly_ambassadors.week_end_date IS 'End date of the week';

-- Force reload de customer_reviews en ajoutant un commentaire
COMMENT ON COLUMN customer_reviews.customer_name IS 'Customer full name';
COMMENT ON COLUMN customer_reviews.customer_email IS 'Customer email address';

-- Force reload de user_sessions en ajoutant un commentaire
COMMENT ON TABLE user_sessions IS 'User session tracking table';

-- Recréer la fonction upsert_user_session pour forcer PostgREST à la recharger
DROP FUNCTION IF EXISTS upsert_user_session(uuid, uuid);

CREATE OR REPLACE FUNCTION upsert_user_session(
  p_session_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Force notification PostgREST
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
