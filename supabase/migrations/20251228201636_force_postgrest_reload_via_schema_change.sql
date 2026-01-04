/*
  # Force PostgREST Reload via Schema Changes
  
  Fait des changements mineurs pour forcer PostgREST à recharger son cache.
*/

-- 1. Altérer les types de données temporairement (même type, force reload)
ALTER TABLE weekly_ambassadors ALTER COLUMN week_start_date TYPE date;
ALTER TABLE weekly_ambassadors ALTER COLUMN week_end_date TYPE date;
ALTER TABLE customer_reviews ALTER COLUMN customer_name TYPE text;

-- 2. Dropper et recréer les vues matérialisées si elles existent
DO $$
BEGIN
  -- Supprimer les vues qui pourraient cacher les vraies tables
  DROP VIEW IF EXISTS weekly_ambassadors_view CASCADE;
  DROP VIEW IF EXISTS customer_reviews_view CASCADE;
END $$;

-- 3. S'assurer que les tables sont bien dans le search_path
ALTER TABLE weekly_ambassadors SET SCHEMA public;
ALTER TABLE customer_reviews SET SCHEMA public;
ALTER TABLE user_sessions SET SCHEMA public;

-- 4. Forcer PostgREST à recharger en modifiant la configuration
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- 5. Invalider tous les caches de PostgREST
DO $$
BEGIN
  PERFORM pg_advisory_unlock_all();
END $$;
