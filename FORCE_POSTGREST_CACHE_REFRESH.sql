-- ============================================================================
-- FORCE POSTGREST CACHE REFRESH - À EXÉCUTER DANS SUPABASE SQL EDITOR
-- ============================================================================
-- Ce script insère des données dans toutes les tables pour forcer PostgREST
-- à rafraîchir son cache et détecter le schéma correctement
-- ============================================================================

-- 1. FORCER NOTIFICATION POSTGREST
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 2. INSÉRER DES DONNÉES DANS TOUTES LES TABLES CRITIQUES

-- user_roles (LA PLUS IMPORTANTE POUR L'ADMIN)
INSERT INTO user_roles (user_id, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'test_cache_refresh',
  now(),
  now()
)
ON CONFLICT (user_id, role) DO NOTHING;

-- user_profiles
INSERT INTO user_profiles (id, email, wallet_balance, created_at)
VALUES (
  gen_random_uuid(),
  'cache_refresh_test@example.com',
  0,
  now()
)
ON CONFLICT (id) DO NOTHING;

-- home_slides
INSERT INTO home_slides (title, subtitle, image_url, display_order, is_active, created_at, updated_at)
VALUES (
  'Cache Refresh Test',
  'Test slide for cache refresh',
  'https://example.com/test.jpg',
  9999,
  false,
  now(),
  now()
);

-- home_categories
INSERT INTO home_categories (title, description, image_url, link_url, display_order, is_active, created_at, updated_at)
VALUES (
  'Cache Refresh Test',
  'Test category for cache refresh',
  'https://example.com/test.jpg',
  '/test',
  9999,
  false,
  now(),
  now()
);

-- featured_products
INSERT INTO featured_products (product_id, display_order, is_active, created_at, updated_at)
VALUES (
  1,
  9999,
  false,
  now(),
  now()
)
ON CONFLICT DO NOTHING;

-- scratch_game_settings
INSERT INTO scratch_game_settings (key, value, updated_at)
VALUES (
  'cache_refresh_test',
  'true',
  now()
)
ON CONFLICT (key) DO UPDATE SET updated_at = now();

-- wheel_game_settings
INSERT INTO wheel_game_settings (key, value, updated_at)
VALUES (
  'cache_refresh_test',
  'true',
  now()
)
ON CONFLICT (key) DO UPDATE SET updated_at = now();

-- customer_reviews
INSERT INTO customer_reviews (user_id, rating, comment, is_approved, created_at)
VALUES (
  gen_random_uuid(),
  5,
  'Cache refresh test review',
  false,
  now()
);

-- contact_messages
INSERT INTO contact_messages (name, email, subject, message, status, created_at)
VALUES (
  'Cache Refresh Test',
  'test@example.com',
  'Test Subject',
  'This is a test message for cache refresh',
  'new',
  now()
);

-- newsletter_subscriptions
INSERT INTO newsletter_subscriptions (email, created_at)
VALUES (
  'cache_refresh_' || gen_random_uuid() || '@example.com',
  now()
);

-- loyalty_points
INSERT INTO loyalty_points (user_id, points, source, created_at)
VALUES (
  gen_random_uuid(),
  0,
  'cache_refresh_test',
  now()
);

-- coupons
INSERT INTO coupons (code, discount_type, discount_value, expires_at, is_active, max_uses, created_at, updated_at)
VALUES (
  'CACHE_TEST_' || gen_random_uuid(),
  'percentage',
  0,
  now() + interval '1 day',
  false,
  1,
  now(),
  now()
);

-- delivery_batches
INSERT INTO delivery_batches (batch_name, start_date, end_date, is_active, created_at, updated_at)
VALUES (
  'Cache Refresh Test Batch',
  now(),
  now() + interval '7 days',
  false,
  now(),
  now()
);

-- live_streams
INSERT INTO live_streams (title, description, stream_url, is_live, created_at, updated_at)
VALUES (
  'Cache Refresh Test Stream',
  'Test stream for cache refresh',
  'https://example.com/test',
  false,
  now(),
  now()
);

-- 3. FORCER LA MISE À JOUR DE TOUTES LES FONCTIONS RPC
-- Recréer les fonctions pour forcer PostgREST à les détecter

DROP FUNCTION IF EXISTS get_user_role();
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  RETURN COALESCE(user_role, 'customer');
END;
$$;

DROP FUNCTION IF EXISTS set_user_role(UUID, TEXT);
CREATE OR REPLACE FUNCTION set_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_roles (user_id, role, created_at, updated_at)
  VALUES (target_user_id, new_role, now(), now())
  ON CONFLICT (user_id, role)
  DO UPDATE SET updated_at = now();

  RETURN TRUE;
END;
$$;

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION set_user_role(UUID, TEXT) TO service_role;

-- 5. FORCER ENCORE LA NOTIFICATION
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- 6. MODIFICATION LÉGÈRE DU SCHÉMA (FORCE LE RAFRAÎCHISSEMENT)
-- Ajouter une colonne temporaire puis la supprimer
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS temp_cache_refresh BOOLEAN DEFAULT false;
ALTER TABLE user_roles DROP COLUMN IF EXISTS temp_cache_refresh;

-- 7. VACUUM ANALYZE (NETTOIE ET RAFRAÎCHIT LES STATS)
VACUUM ANALYZE user_roles;
VACUUM ANALYZE user_profiles;
VACUUM ANALYZE home_slides;
VACUUM ANALYZE home_categories;

-- 8. AFFICHER UN RÉSUMÉ
SELECT 'Cache refresh forcé - Redémarrez PostgREST depuis le Dashboard Supabase' AS message;
SELECT 'Settings -> API -> Restart PostgREST' AS action;

-- 9. VÉRIFICATION DES FONCTIONS
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_role', 'set_user_role')
ORDER BY routine_name;

-- ============================================================================
-- INSTRUCTIONS APRÈS EXÉCUTION
-- ============================================================================
-- 1. Exécutez ce script dans le SQL Editor de Supabase
-- 2. Allez dans Settings -> API
-- 3. Scrollez jusqu'à PostgREST
-- 4. Cliquez sur "Restart"
-- 5. Attendez 60 secondes
-- 6. Testez /diagnostic-admin
-- ============================================================================
