-- ========================================
-- SCRIPT DE VÉRIFICATION AVANT SUPPRESSION
-- Base de données: qcqbtmvbvipsxwjlgjvk
-- Date: 2026-01-10
-- ========================================
--
-- ATTENTION: Ce script vérifie les données avant suppression
-- NE PAS exécuter les DROP sans vérifier les résultats!
--
-- ========================================

-- ========================================
-- PARTIE 1: VÉRIFICATION DES TABLES ORPHELINES
-- ========================================

-- Tables complètement orphelines (0 références)
SELECT 'TABLES ORPHELINES - VÉRIFICATION DES DONNÉES' as section;

SELECT 'customer_reviews_v2' as table_name, COUNT(*) as row_count FROM customer_reviews_v2
UNION ALL
SELECT 'daily_checkins', COUNT(*) FROM daily_checkins
UNION ALL
SELECT 'diamond_finds', COUNT(*) FROM diamond_finds
UNION ALL
SELECT 'game_participations', COUNT(*) FROM game_participations
UNION ALL
SELECT 'scratch_card_campaigns', COUNT(*) FROM scratch_card_campaigns
UNION ALL
SELECT 'video_shorts', COUNT(*) FROM video_shorts
UNION ALL
SELECT 'wheel_campaigns', COUNT(*) FROM wheel_campaigns;

-- ========================================
-- PARTIE 2: VÉRIFICATION DES DOUBLONS
-- ========================================

SELECT 'VÉRIFICATION DES DOUBLONS' as section;

-- Système de reviews
SELECT 'REVIEWS - Comparaison' as info;
SELECT 'customer_reviews' as table_name, COUNT(*) as rows FROM customer_reviews
UNION ALL
SELECT 'customer_reviews_v2', COUNT(*) FROM customer_reviews_v2
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews;

-- Système de diamants
SELECT 'DIAMANTS - Comparaison' as info;
SELECT 'hidden_diamonds' as table_name, COUNT(*) as rows FROM hidden_diamonds
UNION ALL
SELECT 'diamond_discoveries', COUNT(*) FROM diamond_discoveries
UNION ALL
SELECT 'diamond_findings', COUNT(*) FROM diamond_findings
UNION ALL
SELECT 'diamond_finds', COUNT(*) FROM diamond_finds;

-- Système de référencement
SELECT 'REFERRALS - Comparaison' as info;
SELECT 'referral_codes' as table_name, COUNT(*) as rows FROM referral_codes
UNION ALL
SELECT 'referral_uses', COUNT(*) FROM referral_uses
UNION ALL
SELECT 'referral_usage', COUNT(*) FROM referral_usage
UNION ALL
SELECT 'referral_rewards', COUNT(*) FROM referral_rewards;

-- Système de coupons
SELECT 'COUPONS - Comparaison' as info;
SELECT 'coupons' as table_name, COUNT(*) as rows FROM coupons
UNION ALL
SELECT 'user_coupons', COUNT(*) FROM user_coupons
UNION ALL
SELECT 'coupon_types', COUNT(*) FROM coupon_types
UNION ALL
SELECT 'coupon_usage', COUNT(*) FROM coupon_usage
UNION ALL
SELECT 'cross_coupons', COUNT(*) FROM cross_coupons
UNION ALL
SELECT 'cross_platform_coupons', COUNT(*) FROM cross_platform_coupons;

-- Système de live streaming
SELECT 'LIVE STREAMING - Comparaison' as info;
SELECT 'live_chat_messages' as table_name, COUNT(*) as rows FROM live_chat_messages
UNION ALL
SELECT 'live_stream_chat_messages', COUNT(*) FROM live_stream_chat_messages
UNION ALL
SELECT 'live_shared_products', COUNT(*) FROM live_shared_products
UNION ALL
SELECT 'live_stream_products', COUNT(*) FROM live_stream_products;

-- Système loyalty
SELECT 'LOYALTY - Comparaison' as info;
SELECT 'loyalty_transactions' as table_name, COUNT(*) as rows FROM loyalty_transactions
UNION ALL
SELECT 'loyalty_transactions_v2', COUNT(*) FROM loyalty_transactions_v2;

-- ========================================
-- PARTIE 3: VÉRIFICATION DES TABLES PEU UTILISÉES
-- ========================================

SELECT 'TABLES PEU UTILISÉES' as section;

SELECT 'coupon_usage' as table_name, COUNT(*) as rows FROM coupon_usage
UNION ALL
SELECT 'delivery_batch_items', COUNT(*) FROM delivery_batch_items
UNION ALL
SELECT 'live_attendance', COUNT(*) FROM live_attendance
UNION ALL
SELECT 'live_recordings', COUNT(*) FROM live_recordings
UNION ALL
SELECT 'live_stream_analytics', COUNT(*) FROM live_stream_analytics
UNION ALL
SELECT 'live_stream_settings', COUNT(*) FROM live_stream_settings
UNION ALL
SELECT 'live_stream_viewers', COUNT(*) FROM live_stream_viewers
UNION ALL
SELECT 'live_viewers', COUNT(*) FROM live_viewers
UNION ALL
SELECT 'look_bundle_carts', COUNT(*) FROM look_bundle_carts
UNION ALL
SELECT 'loyalty_euro_transactions', COUNT(*) FROM loyalty_euro_transactions
UNION ALL
SELECT 'loyalty_wallet', COUNT(*) FROM loyalty_wallet
UNION ALL
SELECT 'product_attribute_values', COUNT(*) FROM product_attribute_values
UNION ALL
SELECT 'product_images', COUNT(*) FROM product_images
UNION ALL
SELECT 'review_email_queue', COUNT(*) FROM review_email_queue;

-- ========================================
-- PARTIE 4: VÉRIFICATION DES CONTRAINTES
-- ========================================

SELECT 'CONTRAINTES DE CLÉS ÉTRANGÈRES' as section;

-- Lister toutes les contraintes qui référencent les tables à supprimer
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND (
        tc.table_name IN (
            'customer_reviews_v2', 'daily_checkins', 'diamond_finds',
            'game_participations', 'scratch_card_campaigns', 'video_shorts',
            'wheel_campaigns', 'referral_usage', 'referral_rewards',
            'cross_coupons', 'cross_platform_coupons',
            'live_stream_chat_messages', 'loyalty_transactions_v2'
        )
        OR ccu.table_name IN (
            'customer_reviews_v2', 'daily_checkins', 'diamond_finds',
            'game_participations', 'scratch_card_campaigns', 'video_shorts',
            'wheel_campaigns', 'referral_usage', 'referral_rewards',
            'cross_coupons', 'cross_platform_coupons',
            'live_stream_chat_messages', 'loyalty_transactions_v2'
        )
    )
ORDER BY tc.table_name, tc.constraint_name;

-- ========================================
-- PARTIE 5: EXPORT DE SAUVEGARDE (optionnel)
-- ========================================

-- Si vous voulez sauvegarder les données avant suppression:
-- Décommenter et exécuter ces lignes

/*
-- Exporter les données des tables à supprimer (au cas où)
COPY (SELECT * FROM customer_reviews_v2) TO '/tmp/backup_customer_reviews_v2.csv' WITH CSV HEADER;
COPY (SELECT * FROM reviews) TO '/tmp/backup_reviews.csv' WITH CSV HEADER;
COPY (SELECT * FROM coupon_types) TO '/tmp/backup_coupon_types.csv' WITH CSV HEADER;
-- ... etc pour chaque table avec des données
*/

-- ========================================
-- RÉSUMÉ FINAL
-- ========================================

SELECT 'RÉSUMÉ DE LA VÉRIFICATION' as section;

WITH table_counts AS (
    SELECT 'customer_reviews_v2' as table_name, (SELECT COUNT(*) FROM customer_reviews_v2) as row_count
    UNION ALL SELECT 'daily_checkins', (SELECT COUNT(*) FROM daily_checkins)
    UNION ALL SELECT 'diamond_finds', (SELECT COUNT(*) FROM diamond_finds)
    UNION ALL SELECT 'game_participations', (SELECT COUNT(*) FROM game_participations)
    UNION ALL SELECT 'scratch_card_campaigns', (SELECT COUNT(*) FROM scratch_card_campaigns)
    UNION ALL SELECT 'video_shorts', (SELECT COUNT(*) FROM video_shorts)
    UNION ALL SELECT 'wheel_campaigns', (SELECT COUNT(*) FROM wheel_campaigns)
    UNION ALL SELECT 'referral_usage', (SELECT COUNT(*) FROM referral_usage)
    UNION ALL SELECT 'referral_rewards', (SELECT COUNT(*) FROM referral_rewards)
    UNION ALL SELECT 'cross_coupons', (SELECT COUNT(*) FROM cross_coupons)
    UNION ALL SELECT 'cross_platform_coupons', (SELECT COUNT(*) FROM cross_platform_coupons)
    UNION ALL SELECT 'live_stream_chat_messages', (SELECT COUNT(*) FROM live_stream_chat_messages)
    UNION ALL SELECT 'loyalty_transactions_v2', (SELECT COUNT(*) FROM loyalty_transactions_v2)
    UNION ALL SELECT 'diamond_findings', (SELECT COUNT(*) FROM diamond_findings)
)
SELECT
    table_name,
    row_count,
    CASE
        WHEN row_count = 0 THEN '✅ Sûr de supprimer'
        WHEN row_count < 10 THEN '⚠️ Peu de données, vérifier'
        ELSE '❌ Contient des données, SAUVEGARDER avant!'
    END as recommendation
FROM table_counts
ORDER BY row_count DESC, table_name;

-- ========================================
-- FIN DE LA VÉRIFICATION
-- ========================================

SELECT '✅ Vérification terminée!' as status;
SELECT 'Consultez les résultats avant de procéder aux suppressions' as next_step;
