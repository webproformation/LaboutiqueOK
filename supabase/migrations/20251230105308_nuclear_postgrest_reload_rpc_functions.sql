/*
  # Rechargement nucléaire de PostgREST pour les fonctions RPC
  
  1. Changes
    - Créer une table temporaire pour forcer le rechargement
    - Recréer les fonctions RPC avec de nouveaux noms temporaires
    - Forcer de multiples notifications
  
  2. Goal
    - Forcer PostgREST à détecter absolument toutes les fonctions RPC
*/

-- Créer une table temporaire qui sera supprimée immédiatement
CREATE TABLE IF NOT EXISTS _force_rpc_reload_temp (
  id serial PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- Drop immédiatement
DROP TABLE IF EXISTS _force_rpc_reload_temp CASCADE;

-- Recreate functions with explicit search_path
CREATE OR REPLACE FUNCTION get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
  
  RETURN COALESCE(v_role, 'customer');
END;
$$;

CREATE OR REPLACE FUNCTION get_loyalty_tier(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_total_spent numeric;
  v_tier text;
BEGIN
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_total_spent
  FROM orders
  WHERE user_id = p_user_id 
    AND status IN ('completed', 'processing');
  
  IF v_total_spent >= 1000 THEN
    v_tier := 'diamond';
  ELSIF v_total_spent >= 500 THEN
    v_tier := 'gold';
  ELSIF v_total_spent >= 200 THEN
    v_tier := 'silver';
  ELSE
    v_tier := 'bronze';
  END IF;
  
  RETURN v_tier;
END;
$$;

-- Revoke et regrant pour forcer la détection
REVOKE ALL ON FUNCTION get_user_role FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION get_loyalty_tier FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION get_user_role TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_loyalty_tier TO anon, authenticated, service_role;

-- Update comments with new timestamp
COMMENT ON FUNCTION get_user_role IS 'User role RPC - nuclear reload 2025-12-30 11:10';
COMMENT ON FUNCTION get_loyalty_tier IS 'Loyalty tier RPC - nuclear reload 2025-12-30 11:10';

-- Send 20 reload notifications
DO $$
DECLARE
  i integer;
BEGIN
  FOR i IN 1..20 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    IF i % 5 = 0 THEN
      PERFORM pg_notify('pgrst', 'reload config');
    END IF;
    PERFORM pg_sleep(0.15);
  END LOOP;
END $$;
