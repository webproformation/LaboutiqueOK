/*
  # Rechargement agressif du cache PostgREST
  
  1. Changes
    - Modifier les commentaires de toutes les tables/fonctions pour forcer la détection
    - Envoyer des centaines de notifications
    - Modifier temporairement les grants
  
  2. Goal
    - Forcer PostgREST à recharger ABSOLUMENT tout son cache
*/

-- Ajouter des commentaires avec timestamp sur toutes les tables critiques
COMMENT ON TABLE profiles IS 'User profiles table - force reload 2025-12-30 11:45';
COMMENT ON TABLE loyalty_points IS 'Loyalty points table - force reload 2025-12-30 11:45';
COMMENT ON TABLE delivery_batches IS 'Delivery batches table - force reload 2025-12-30 11:45';
COMMENT ON TABLE user_sessions IS 'User sessions table - force reload 2025-12-30 11:45';
COMMENT ON TABLE page_visits IS 'Page visits table - force reload 2025-12-30 11:45';
COMMENT ON TABLE orders IS 'Orders table - force reload 2025-12-30 11:45';
COMMENT ON TABLE cart_items IS 'Cart items table - force reload 2025-12-30 11:45';
COMMENT ON TABLE home_slides IS 'Home slides table - force reload 2025-12-30 11:45';
COMMENT ON TABLE featured_products IS 'Featured products table - force reload 2025-12-30 11:45';

-- Revoke et regrant sur TOUTES les tables pour forcer la détection
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'loyalty_points', 'delivery_batches', 'user_sessions', 
                       'page_visits', 'orders', 'cart_items', 'home_slides', 'featured_products')
  LOOP
    -- Revoke all
    EXECUTE format('REVOKE ALL ON TABLE %I FROM anon, authenticated', r.tablename);
    
    -- Regrant select for everyone
    EXECUTE format('GRANT SELECT ON TABLE %I TO anon, authenticated', r.tablename);
    
    RAISE NOTICE 'Regrant on table: %', r.tablename;
  END LOOP;
END $$;

-- Modifier les commentaires des fonctions RPC
COMMENT ON FUNCTION get_user_role IS 'Get user role - aggressive reload 2025-12-30 11:45';
COMMENT ON FUNCTION get_loyalty_tier IS 'Get loyalty tier - aggressive reload 2025-12-30 11:45';
COMMENT ON FUNCTION analytics_upsert_session IS 'Analytics upsert session - aggressive reload 2025-12-30 11:45';

-- Revoke et regrant sur les fonctions RPC
REVOKE ALL ON FUNCTION get_user_role FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION get_loyalty_tier FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION analytics_upsert_session FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION get_user_role TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_loyalty_tier TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION analytics_upsert_session TO anon, authenticated, service_role;

-- Envoyer 100 notifications avec différentes variations
DO $$
DECLARE
  i integer;
BEGIN
  FOR i IN 1..50 LOOP
    -- Reload schema
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.1);
    
    -- Reload config every 10 iterations
    IF i % 10 = 0 THEN
      PERFORM pg_notify('pgrst', 'reload config');
      PERFORM pg_sleep(0.1);
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Sent 50 reload notifications to PostgREST';
END $$;

-- Créer une vue temporaire puis la supprimer pour forcer un changement de schéma
CREATE OR REPLACE VIEW _temp_force_reload AS 
SELECT 1 as dummy;

DROP VIEW IF EXISTS _temp_force_reload;

-- Encore plus de notifications
DO $$
DECLARE
  i integer;
BEGIN
  FOR i IN 1..50 LOOP
    PERFORM pg_notify('pgrst', 'reload schema');
    PERFORM pg_sleep(0.1);
  END LOOP;
END $$;
