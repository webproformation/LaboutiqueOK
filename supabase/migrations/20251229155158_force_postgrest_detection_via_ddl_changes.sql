/*
  # Forcer PostgREST à détecter tout le schéma via changements DDL
  
  Technique: créer et supprimer des objets pour forcer la détection
*/

-- 1. Créer une table temporaire qui va forcer PostgREST à recharger
CREATE TABLE IF NOT EXISTS _postgrest_reload_trigger (
  id SERIAL PRIMARY KEY,
  reloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Accorder les permissions
GRANT ALL ON _postgrest_reload_trigger TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE _postgrest_reload_trigger_id_seq TO anon, authenticated, service_role;

-- 3. Créer une policy
ALTER TABLE _postgrest_reload_trigger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all" ON _postgrest_reload_trigger FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);

-- 4. Insérer une donnée
INSERT INTO _postgrest_reload_trigger (reloaded_at) VALUES (NOW());

-- 5. Supprimer la table pour forcer un changement DDL
DROP TABLE IF EXISTS _postgrest_reload_trigger CASCADE;

-- 6. Recréer les fonctions avec une signature légèrement différente pour forcer la détection
CREATE OR REPLACE FUNCTION public.get_loyalty_tier(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.upsert_user_session(
  p_session_id text,
  p_user_id uuid DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.award_daily_connection_bonus(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
SET search_path = public
AS $$
DECLARE
  v_last_bonus_date date;
  v_points_awarded integer := 10;
BEGIN
  SELECT MAX(DATE(created_at))
  INTO v_last_bonus_date
  FROM daily_connection_rewards
  WHERE user_id = p_user_id;

  IF v_last_bonus_date IS NULL OR v_last_bonus_date < CURRENT_DATE THEN
    INSERT INTO daily_connection_rewards (user_id, points_awarded)
    VALUES (p_user_id, v_points_awarded);
    
    UPDATE loyalty_points
    SET total_points = COALESCE(total_points, 0) + v_points_awarded,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
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

-- 7. Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_loyalty_tier(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_user_session(text, uuid, text, inet) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.award_daily_connection_bonus(uuid) TO anon, authenticated, service_role;

-- 8. Forcer PostgREST à recharger
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';