-- ============================================
-- NETTOYAGE COMPLET DE LA BASE DE DONNÉES
-- ============================================

-- 1. Désactiver temporairement RLS pour pouvoir supprimer
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE 'ALTER TABLE IF EXISTS ' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- 2. Supprimer toutes les policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. Supprimer toutes les fonctions personnalisées
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS is_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS award_diamond_reward(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS upsert_analytics_session(text, uuid, text, inet) CASCADE;
DROP FUNCTION IF EXISTS upsert_user_session(text, uuid, text, inet) CASCADE;
DROP FUNCTION IF EXISTS create_user_profile_manual(uuid, text, text) CASCADE;
DROP FUNCTION IF EXISTS get_user_plays_today(uuid) CASCADE;

-- 4. Supprimer toutes les tables
DROP TABLE IF EXISTS woocommerce_products_cache CASCADE;
DROP TABLE IF EXISTS woocommerce_categories_cache CASCADE;
DROP TABLE IF EXISTS wishlist_items CASCADE;
DROP TABLE IF EXISTS wheel_game_plays CASCADE;
DROP TABLE IF EXISTS wheel_game_settings CASCADE;
DROP TABLE IF EXISTS welcome_bonuses CASCADE;
DROP TABLE IF EXISTS weekly_ambassadors CASCADE;
DROP TABLE IF EXISTS wallet_transactions CASCADE;
DROP TABLE IF EXISTS wallet_credits CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS user_coupons CASCADE;
DROP TABLE IF EXISTS shipping_methods CASCADE;
DROP TABLE IF EXISTS seo_metadata CASCADE;
DROP TABLE IF EXISTS scratch_game_settings CASCADE;
DROP TABLE IF EXISTS scratch_game_prizes CASCADE;
DROP TABLE IF EXISTS scratch_game_plays CASCADE;
DROP TABLE IF EXISTS review_reminders CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS return_items CASCADE;
DROP TABLE IF EXISTS related_products CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS referral_codes CASCADE;
DROP TABLE IF EXISTS push_notifications CASCADE;
DROP TABLE IF EXISTS push_notification_settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS product_reviews CASCADE;
DROP TABLE IF EXISTS product_availability_notifications CASCADE;
DROP TABLE IF EXISTS pending_prizes CASCADE;
DROP TABLE IF EXISTS page_visits CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS order_mondial_relay_shipments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS order_invoices CASCADE;
DROP TABLE IF EXISTS order_gift_tracking CASCADE;
DROP TABLE IF EXISTS order_analytics CASCADE;
DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;
DROP TABLE IF EXISTS news_categories CASCADE;
DROP TABLE IF EXISTS mondial_relay_pickup_points CASCADE;
DROP TABLE IF EXISTS loyalty_transactions CASCADE;
DROP TABLE IF EXISTS loyalty_rewards_unlocked CASCADE;
DROP TABLE IF EXISTS loyalty_rewards CASCADE;
DROP TABLE IF EXISTS loyalty_points CASCADE;
DROP TABLE IF EXISTS loyalty_live_shares CASCADE;
DROP TABLE IF EXISTS looks CASCADE;
DROP TABLE IF EXISTS look_products CASCADE;
DROP TABLE IF EXISTS look_bundle_carts CASCADE;
DROP TABLE IF EXISTS live_streams CASCADE;
DROP TABLE IF EXISTS live_stream_viewers CASCADE;
DROP TABLE IF EXISTS live_stream_settings CASCADE;
DROP TABLE IF EXISTS live_stream_products CASCADE;
DROP TABLE IF EXISTS live_stream_chat_messages CASCADE;
DROP TABLE IF EXISTS live_stream_analytics CASCADE;
DROP TABLE IF EXISTS live_presence_rewards CASCADE;
DROP TABLE IF EXISTS live_participations CASCADE;
DROP TABLE IF EXISTS home_slides CASCADE;
DROP TABLE IF EXISTS home_categories CASCADE;
DROP TABLE IF EXISTS hidden_diamonds CASCADE;
DROP TABLE IF EXISTS guestbook_votes CASCADE;
DROP TABLE IF EXISTS guestbook_settings CASCADE;
DROP TABLE IF EXISTS guestbook_likes CASCADE;
DROP TABLE IF EXISTS guestbook_entries CASCADE;
DROP TABLE IF EXISTS gift_thresholds CASCADE;
DROP TABLE IF EXISTS gift_settings CASCADE;
DROP TABLE IF EXISTS featured_products CASCADE;
DROP TABLE IF EXISTS diamond_finds CASCADE;
DROP TABLE IF EXISTS delivery_batches CASCADE;
DROP TABLE IF EXISTS delivery_batch_items CASCADE;
DROP TABLE IF EXISTS daily_connection_rewards CASCADE;
DROP TABLE IF EXISTS customer_reviews CASCADE;
DROP TABLE IF EXISTS cross_promotion_coupons CASCADE;
DROP TABLE IF EXISTS coupon_types CASCADE;
DROP TABLE IF EXISTS cookie_consents CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS client_measurements CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS birthday_vouchers CASCADE;
DROP TABLE IF EXISTS backups CASCADE;
DROP TABLE IF EXISTS backup_cron_log CASCADE;
DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS analytics_sessions CASCADE;
DROP TABLE IF EXISTS cookie_consent_logs CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS client_preferences CASCADE;
DROP TABLE IF EXISTS loyalty_tiers CASCADE;
DROP TABLE IF EXISTS news_posts CASCADE;
DROP TABLE IF EXISTS facebook_reviews CASCADE;
DROP TABLE IF EXISTS looks_bundles CASCADE;
DROP TABLE IF EXISTS looks_bundle_products CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS live_chat_messages CASCADE;
DROP TABLE IF EXISTS live_stream_products CASCADE;
DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;
DROP TABLE IF EXISTS woocommerce_cache CASCADE;

-- 5. Supprimer les storage policies
DROP POLICY IF EXISTS "Authenticated users upload order docs" ON storage.objects;
DROP POLICY IF EXISTS "Users read own order docs" ON storage.objects;
DROP POLICY IF EXISTS "Service role manages order docs" ON storage.objects;

-- 6. Supprimer les buckets storage
DELETE FROM storage.buckets WHERE id = 'order-documents';

-- 7. Message de confirmation
SELECT 'Base de données nettoyée avec succès! Vous pouvez maintenant exécuter MIGRATION_COMPLETE_FRESH_START.sql' AS message;
