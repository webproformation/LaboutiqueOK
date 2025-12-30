/*
  # Forcer le rechargement des fonctions RPC
  
  1. Changes
    - Modifier légèrement les fonctions pour forcer la détection
    - Ajouter des commentaires avec timestamp
    - Envoyer des NOTIFY multiples
  
  2. Goal
    - Forcer PostgREST à détecter get_user_role et get_loyalty_tier
*/

-- Modifier get_user_role pour forcer la détection
CREATE OR REPLACE FUNCTION get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Modifier get_loyalty_tier pour forcer la détection
CREATE OR REPLACE FUNCTION get_loyalty_tier(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_spent numeric;
  v_tier text;
BEGIN
  -- Get total spent by user
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_total_spent
  FROM orders
  WHERE user_id = p_user_id 
    AND status IN ('completed', 'processing');
  
  -- Determine tier based on spending
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

-- Grants
GRANT EXECUTE ON FUNCTION get_user_role TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_loyalty_tier TO anon, authenticated, service_role;

-- Commentaires avec timestamp
COMMENT ON FUNCTION get_user_role IS 'Get user role function - reloaded 2025-12-30 10:50';
COMMENT ON FUNCTION get_loyalty_tier IS 'Get loyalty tier function - reloaded 2025-12-30 10:50';

-- Force reload massif
DO $$
DECLARE
  i integer;
BEGIN
  FOR i IN 1..10 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.1);
  END LOOP;
  
  PERFORM pg_notify('pgrst', 'reload config');
  
  FOR i IN 1..10 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;
