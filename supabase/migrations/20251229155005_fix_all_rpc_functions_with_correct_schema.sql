/*
  # Corriger toutes les fonctions RPC avec le bon schéma
  
  Les fonctions utilisaient une ancienne structure de loyalty_points.
  Cette migration les corrige pour utiliser la vraie structure.
*/

-- 1. Corriger get_loyalty_tier pour utiliser total_points
DROP FUNCTION IF EXISTS get_loyalty_tier(uuid) CASCADE;
CREATE FUNCTION get_loyalty_tier(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_total_points integer;
BEGIN
  SELECT COALESCE(total_points, 0)
  INTO v_total_points
  FROM loyalty_points
  WHERE user_id = p_user_id;

  IF v_total_points >= 5000 THEN RETURN 'platinum';
  ELSIF v_total_points >= 2000 THEN RETURN 'gold';
  ELSIF v_total_points >= 500 THEN RETURN 'silver';
  ELSE RETURN 'bronze';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'bronze';
END;
$$;

-- 2. Corriger award_daily_connection_bonus
DROP FUNCTION IF EXISTS award_daily_connection_bonus(uuid) CASCADE;
CREATE FUNCTION award_daily_connection_bonus(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
AS $$
DECLARE
  v_last_bonus_date date;
  v_points_awarded integer := 10;
  v_current_total integer;
BEGIN
  -- Vérifier si l'utilisateur a déjà reçu son bonus aujourd'hui
  SELECT MAX(DATE(created_at))
  INTO v_last_bonus_date
  FROM daily_connection_rewards
  WHERE user_id = p_user_id;

  IF v_last_bonus_date IS NULL OR v_last_bonus_date < CURRENT_DATE THEN
    -- Ajouter le bonus aux daily_connection_rewards
    INSERT INTO daily_connection_rewards (user_id, points_awarded)
    VALUES (p_user_id, v_points_awarded);
    
    -- Mettre à jour total_points dans loyalty_points
    UPDATE loyalty_points
    SET total_points = COALESCE(total_points, 0) + v_points_awarded,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Si l'utilisateur n'a pas de ligne dans loyalty_points, la créer
    INSERT INTO loyalty_points (user_id, page_visit_points, live_participation_count, total_points)
    VALUES (p_user_id, 0, 0, v_points_awarded)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN jsonb_build_object('awarded', true, 'points', v_points_awarded);
  ELSE
    RETURN jsonb_build_object('awarded', false, 'points', 0);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('awarded', false, 'points', 0, 'error', SQLERRM);
END;
$$;

-- 3. get_user_role reste la même
DROP FUNCTION IF EXISTS get_user_role(uuid) CASCADE;
CREATE FUNCTION get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role FROM user_roles WHERE user_id = p_user_id;
  RETURN COALESCE(v_role, 'user');
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'user';
END;
$$;

-- 4. upsert_user_session reste la même
DROP FUNCTION IF EXISTS upsert_user_session(text, uuid, text, inet) CASCADE;
CREATE FUNCTION upsert_user_session(
  p_session_id text,
  p_user_id uuid DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
AS $$
DECLARE
  v_session_uuid uuid;
BEGIN
  INSERT INTO user_sessions (session_id, user_id, user_agent, ip_address, last_seen)
  VALUES (p_session_id, p_user_id, p_user_agent, p_ip_address, NOW())
  ON CONFLICT (session_id)
  DO UPDATE SET
    user_id = COALESCE(EXCLUDED.user_id, user_sessions.user_id),
    last_seen = NOW()
  RETURNING id INTO v_session_uuid;

  RETURN v_session_uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- Accorder toutes les permissions
GRANT EXECUTE ON FUNCTION get_loyalty_tier(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION award_daily_connection_bonus(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION upsert_user_session(text, uuid, text, inet) TO anon, authenticated, service_role;

-- Forcer PostgREST à recharger
NOTIFY pgrst, 'reload schema';