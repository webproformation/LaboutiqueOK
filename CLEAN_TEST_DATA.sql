-- ============================================================================
-- NETTOYAGE DES DONNÉES DE TEST (À EXÉCUTER APRÈS LE RAFRAÎCHISSEMENT)
-- ============================================================================
-- Ce script supprime toutes les données de test créées pour forcer le cache
-- À exécuter UNIQUEMENT après avoir vérifié que le cache fonctionne
-- ============================================================================

-- Supprimer les rôles de test
DELETE FROM user_roles
WHERE role = 'test_cache_refresh';

-- Supprimer les profils de test
DELETE FROM user_profiles
WHERE email LIKE '%cache_refresh%@example.com';

-- Supprimer les slides de test
DELETE FROM home_slides
WHERE title = 'Cache Refresh Test';

-- Supprimer les catégories de test
DELETE FROM home_categories
WHERE title = 'Cache Refresh Test';

-- Supprimer les produits vedette de test
DELETE FROM featured_products
WHERE display_order = 9999;

-- Supprimer les settings de test
DELETE FROM scratch_game_settings
WHERE key = 'cache_refresh_test';

DELETE FROM wheel_game_settings
WHERE key = 'cache_refresh_test';

-- Supprimer les avis de test
DELETE FROM customer_reviews
WHERE comment = 'Cache refresh test review';

-- Supprimer les messages de test
DELETE FROM contact_messages
WHERE name = 'Cache Refresh Test';

-- Supprimer les inscriptions newsletter de test
DELETE FROM newsletter_subscriptions
WHERE email LIKE 'cache_refresh_%@example.com';

-- Supprimer les points de fidélité de test
DELETE FROM loyalty_points
WHERE source = 'cache_refresh_test';

-- Supprimer les coupons de test
DELETE FROM coupons
WHERE code LIKE 'CACHE_TEST_%';

-- Supprimer les lots de livraison de test
DELETE FROM delivery_batches
WHERE batch_name = 'Cache Refresh Test Batch';

-- Supprimer les streams de test
DELETE FROM live_streams
WHERE title = 'Cache Refresh Test Stream';

-- Afficher le résultat
SELECT 'Données de test supprimées avec succès' AS status;
