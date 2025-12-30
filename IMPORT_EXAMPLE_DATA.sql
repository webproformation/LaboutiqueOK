-- ============================================================================
-- IMPORT DES DONNÉES D'EXEMPLE APRÈS RESTAURATION
-- ============================================================================
--
-- À exécuter APRÈS avoir restauré le schéma avec les 110 migrations
-- Ce script crée les données de configuration minimales pour que le site fonctionne
--
-- ============================================================================

-- ============================================================================
-- 1. PARAMÈTRES DES JEUX
-- ============================================================================

-- Jeu de grattage
INSERT INTO scratch_game_settings (id, is_active, prize_pool, max_plays_per_day, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  true,
  1000.00,
  3,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Jeu de la roue
INSERT INTO wheel_game_settings (id, is_active, show_popup, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. PARAMÈTRES DU LIVRE D'OR
-- ============================================================================

INSERT INTO guestbook_settings (id, daily_limit, min_rating_to_display, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  1,
  4,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. NIVEAUX DE FIDÉLITÉ
-- ============================================================================

INSERT INTO loyalty_tiers (name, min_points, discount_percentage, benefits, created_at, updated_at)
VALUES 
  ('Bronze', 0, 0, ARRAY['Accès aux ventes privées'], NOW(), NOW()),
  ('Argent', 500, 5, ARRAY['5% de réduction', 'Accès anticipé aux nouveautés'], NOW(), NOW()),
  ('Or', 1500, 10, ARRAY['10% de réduction', 'Livraison gratuite', 'Cadeaux exclusifs'], NOW(), NOW()),
  ('Platine', 3000, 15, ARRAY['15% de réduction', 'Livraison express gratuite', 'Service client prioritaire'], NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 4. RÉCOMPENSES DE FIDÉLITÉ
-- ============================================================================

INSERT INTO loyalty_rewards (
  tier_name,
  reward_type,
  reward_value,
  points_cost,
  description,
  is_active,
  created_at,
  updated_at
)
VALUES 
  ('Bronze', 'discount', 5, 100, 'Bon de réduction 5€', true, NOW(), NOW()),
  ('Argent', 'discount', 10, 200, 'Bon de réduction 10€', true, NOW(), NOW()),
  ('Or', 'discount', 20, 400, 'Bon de réduction 20€', true, NOW(), NOW()),
  ('Platine', 'discount', 50, 1000, 'Bon de réduction 50€', true, NOW(), NOW()),
  ('Bronze', 'free_shipping', 0, 150, 'Livraison gratuite', true, NOW(), NOW()),
  ('Argent', 'free_shipping', 0, 100, 'Livraison gratuite', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. TYPES DE COUPONS
-- ============================================================================

INSERT INTO coupon_types (
  code,
  type,
  value,
  min_purchase,
  max_uses,
  is_active,
  valid_from,
  valid_until,
  description,
  created_at,
  updated_at
)
VALUES 
  ('BIENVENUE10', 'percentage', 10, 50, NULL, true, NOW(), NOW() + INTERVAL '1 year', 'Bienvenue sur la boutique - 10% de réduction', NOW(), NOW()),
  ('PARRAIN15', 'percentage', 15, 0, NULL, true, NOW(), NOW() + INTERVAL '1 year', 'Code parrainage - 15% de réduction', NOW(), NOW()),
  ('SOLDES20', 'percentage', 20, 100, NULL, true, NOW(), NOW() + INTERVAL '3 months', 'Soldes - 20% sur tout', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 6. MÉTHODES DE LIVRAISON
-- ============================================================================

INSERT INTO shipping_methods (
  name,
  type,
  price,
  free_from_amount,
  estimated_days_min,
  estimated_days_max,
  description,
  is_active,
  created_at,
  updated_at
)
VALUES 
  (
    'Colissimo',
    'colissimo',
    4.95,
    80.00,
    2,
    4,
    'Livraison à domicile par Colissimo avec suivi',
    true,
    NOW(),
    NOW()
  ),
  (
    'Mondial Relay',
    'mondial_relay',
    3.50,
    80.00,
    2,
    5,
    'Livraison en point relais Mondial Relay',
    true,
    NOW(),
    NOW()
  ),
  (
    'Chronopost Express',
    'chronopost',
    9.90,
    150.00,
    1,
    2,
    'Livraison express en 24-48h',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (type) DO NOTHING;

-- ============================================================================
-- 7. SEUILS CADEAUX
-- ============================================================================

INSERT INTO gift_thresholds (
  min_amount,
  gift_product_id,
  gift_description,
  is_active,
  created_at,
  updated_at
)
VALUES 
  (50, NULL, 'Échantillon de parfum offert', true, NOW(), NOW()),
  (100, NULL, 'Trousse de beauté offerte', true, NOW(), NOW()),
  (150, NULL, 'Coffret cadeau offert', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. CATÉGORIES D'ACTUALITÉS
-- ============================================================================

INSERT INTO news_categories (
  name,
  slug,
  description,
  created_at,
  updated_at
)
VALUES 
  ('Mode', 'mode', 'Tendances et conseils mode', NOW(), NOW()),
  ('Beauté', 'beaute', 'Conseils beauté et maquillage', NOW(), NOW()),
  ('Lifestyle', 'lifestyle', 'Vie quotidienne et bien-être', NOW(), NOW()),
  ('Nouveautés', 'nouveautes', 'Les dernières nouveautés de la boutique', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- VÉRIFICATION DE L'IMPORT
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'IMPORT DES DONNÉES D''EXEMPLE TERMINÉ';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Données importées:';
    RAISE NOTICE '- Paramètres des jeux: ✅';
    RAISE NOTICE '- Livre d''or: ✅';
    RAISE NOTICE '- Niveaux de fidélité: ✅';
    RAISE NOTICE '- Récompenses de fidélité: ✅';
    RAISE NOTICE '- Types de coupons: ✅';
    RAISE NOTICE '- Méthodes de livraison: ✅';
    RAISE NOTICE '- Seuils cadeaux: ✅';
    RAISE NOTICE '- Catégories d''actualités: ✅';
    RAISE NOTICE '';
    RAISE NOTICE 'Prochaines étapes:';
    RAISE NOTICE '1. Créer un utilisateur admin avec /create-admin-webpro';
    RAISE NOTICE '2. Synchroniser les catégories WooCommerce avec /admin/sync-categories';
    RAISE NOTICE '3. Configurer les slides de la page d''accueil dans /admin/slides';
    RAISE NOTICE '====================================================================';
END $$;

-- Afficher un résumé des données
SELECT 
  'RÉSUMÉ DES DONNÉES' as info,
  (SELECT COUNT(*) FROM scratch_game_settings) as scratch_settings,
  (SELECT COUNT(*) FROM wheel_game_settings) as wheel_settings,
  (SELECT COUNT(*) FROM guestbook_settings) as guestbook_settings,
  (SELECT COUNT(*) FROM loyalty_tiers) as loyalty_tiers,
  (SELECT COUNT(*) FROM loyalty_rewards) as loyalty_rewards,
  (SELECT COUNT(*) FROM coupon_types) as coupon_types,
  (SELECT COUNT(*) FROM shipping_methods) as shipping_methods,
  (SELECT COUNT(*) FROM gift_thresholds) as gift_thresholds,
  (SELECT COUNT(*) FROM news_categories) as news_categories;
