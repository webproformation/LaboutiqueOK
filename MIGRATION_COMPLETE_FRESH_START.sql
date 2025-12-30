-- ============================================================================
-- RESTAURATION COMPLÈTE DU SYSTÈME AU 28/12/2024 00h20
-- ============================================================================
-- 
-- IMPORTANT : Ce script restaure le SCHÉMA de la base de données
--             PAS LES DONNÉES (il n'y a pas de backup de données disponible)
--
-- UTILISATION :
--   1. Sauvegardez votre base actuelle si nécessaire
--   2. Exécutez ce script dans Supabase SQL Editor
--   3. Appliquez ensuite toutes les migrations jusqu'à 20251227231524
--
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: NETTOYAGE COMPLET (DANGEROUS - SUPPRIME TOUT)
-- ============================================================================

-- Désactiver temporairement les triggers
SET session_replication_role = replica;

-- Supprimer toutes les policies RLS existantes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Supprimer toutes les fonctions du schéma public
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT proname, oidvectortypes(proargtypes) as argtypes
        FROM pg_proc 
        INNER JOIN pg_namespace ON pg_proc.pronamespace = pg_namespace.oid
        WHERE pg_namespace.nspname = 'public'
    ) LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS public.%I(%s) CASCADE', 
            r.proname, r.argtypes);
    END LOOP;
END $$;

-- Supprimer toutes les tables du schéma public dans le bon ordre
DROP TABLE IF EXISTS live_chat_messages CASCADE;
DROP TABLE IF EXISTS live_stream_products CASCADE;
DROP TABLE IF EXISTS live_viewers CASCADE;
DROP TABLE IF EXISTS live_streams CASCADE;
DROP TABLE IF EXISTS looks_products CASCADE;
DROP TABLE IF EXISTS looks CASCADE;
DROP TABLE IF EXISTS push_notification_subscriptions CASCADE;
DROP TABLE IF EXISTS weekly_ambassadors CASCADE;
DROP TABLE IF EXISTS gift_thresholds CASCADE;
DROP TABLE IF EXISTS news_categories CASCADE;
DROP TABLE IF EXISTS scratch_game_prizes CASCADE;
DROP TABLE IF EXISTS diamond_finds CASCADE;
DROP TABLE IF EXISTS return_items CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS facebook_reviews CASCADE;
DROP TABLE IF EXISTS order_invoices CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS customer_reviews CASCADE;
DROP TABLE IF EXISTS guestbook_entries CASCADE;
DROP TABLE IF EXISTS guestbook_settings CASCADE;
DROP TABLE IF EXISTS seo_metadata CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS cookie_consents CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS home_slides CASCADE;
DROP TABLE IF EXISTS featured_products CASCADE;
DROP TABLE IF EXISTS scratch_game_plays CASCADE;
DROP TABLE IF EXISTS scratch_game_settings CASCADE;
DROP TABLE IF EXISTS wheel_game_plays CASCADE;
DROP TABLE IF EXISTS wheel_game_settings CASCADE;
DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;
DROP TABLE IF EXISTS pending_prizes CASCADE;
DROP TABLE IF EXISTS product_availability_notifications CASCADE;
DROP TABLE IF EXISTS loyalty_transactions CASCADE;
DROP TABLE IF EXISTS loyalty_rewards CASCADE;
DROP TABLE IF EXISTS loyalty_tiers CASCADE;
DROP TABLE IF EXISTS loyalty_points CASCADE;
DROP TABLE IF EXISTS client_style_preferences CASCADE;
DROP TABLE IF EXISTS client_measurements CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS birthday_vouchers CASCADE;
DROP TABLE IF EXISTS reward_choices CASCADE;
DROP TABLE IF EXISTS user_coupons CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS coupon_types CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS delivery_batch_orders CASCADE;
DROP TABLE IF EXISTS delivery_batches CASCADE;
DROP TABLE IF EXISTS shipping_methods CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS wishlist_items CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS home_categories CASCADE;
DROP TABLE IF EXISTS woocommerce_cache CASCADE;
DROP TABLE IF EXISTS backups CASCADE;

-- Réactiver les triggers
SET session_replication_role = DEFAULT;

-- ============================================================================
-- MESSAGE IMPORTANT
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'NETTOYAGE TERMINÉ';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Étape suivante:';
    RAISE NOTICE '1. Allez dans Supabase Dashboard > Database > Migrations';
    RAISE NOTICE '2. Appliquez TOUTES les migrations jusqu''à 20251227231524';
    RAISE NOTICE '3. NE PAS appliquer les migrations du 28/12 et après';
    RAISE NOTICE '';
    RAISE NOTICE 'Ou utilisez le script APPLY_ALL_MIGRATIONS.md';
    RAISE NOTICE '====================================================================';
END $$;
