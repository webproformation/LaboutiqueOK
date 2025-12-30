-- ============================================================================
-- RECHERCHE COMPLÈTE DE TOUS LES BACKUPS DISPONIBLES
-- ============================================================================
-- 
-- Ce script vérifie toutes les sources possibles de backup de données
-- dans votre projet Supabase: qcqbtmvbvipsxwjlgjvk
--
-- ============================================================================

-- ============================================================================
-- 1. VÉRIFIER LES BACKUPS AUTOMATIQUES DANS LA TABLE
-- ============================================================================

SELECT 
  '=== BACKUPS AUTOMATIQUES ===' as info,
  COUNT(*) as total_backups
FROM backups
WHERE backup_type IN ('automatic', 'full');

SELECT 
  id,
  backup_type,
  status,
  file_path,
  description,
  created_at,
  completed_at,
  ROUND(file_size::numeric / 1024 / 1024, 2) as size_mb
FROM backups
WHERE backup_type IN ('automatic', 'full')
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================================
-- 2. VÉRIFIER LES LOGS DU CRON DE BACKUP
-- ============================================================================

SELECT 
  '=== LOGS CRON BACKUP ===' as info,
  COUNT(*) as total_executions
FROM backup_cron_log;

SELECT 
  execution_time,
  status,
  details
FROM backup_cron_log
ORDER BY execution_time DESC
LIMIT 20;

-- ============================================================================
-- 3. VÉRIFIER LES TABLES ACTUELLES ET LEUR CONTENU
-- ============================================================================

DO $$ 
DECLARE
    table_record RECORD;
    row_count INTEGER;
BEGIN
    RAISE NOTICE '=== CONTENU ACTUEL DES TABLES ===';
    RAISE NOTICE '';
    
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        EXECUTE format('SELECT COUNT(*) FROM %I', table_record.table_name) INTO row_count;
        RAISE NOTICE '% : % lignes', table_record.table_name, row_count;
    END LOOP;
END $$;

-- ============================================================================
-- 4. VÉRIFIER SI DES DONNÉES HISTORIQUES EXISTENT
-- ============================================================================

-- Cette requête cherche les données les plus anciennes dans chaque table principale
DO $$ 
DECLARE
    oldest_date TIMESTAMP WITH TIME ZONE;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== DATES DES DONNÉES LES PLUS ANCIENNES ===';
    RAISE NOTICE '';
    
    -- user_profiles
    BEGIN
        SELECT MIN(created_at) INTO oldest_date FROM user_profiles;
        IF oldest_date IS NOT NULL THEN
            RAISE NOTICE 'user_profiles: %', oldest_date;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'user_profiles: Table n''existe pas ou est vide';
    END;
    
    -- orders
    BEGIN
        SELECT MIN(created_at) INTO oldest_date FROM orders;
        IF oldest_date IS NOT NULL THEN
            RAISE NOTICE 'orders: %', oldest_date;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'orders: Table n''existe pas ou est vide';
    END;
    
    -- loyalty_points
    BEGIN
        SELECT MIN(created_at) INTO oldest_date FROM loyalty_points;
        IF oldest_date IS NOT NULL THEN
            RAISE NOTICE 'loyalty_points: %', oldest_date;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'loyalty_points: Table n''existe pas ou est vide';
    END;
    
    -- guestbook_entries
    BEGIN
        SELECT MIN(created_at) INTO oldest_date FROM guestbook_entries;
        IF oldest_date IS NOT NULL THEN
            RAISE NOTICE 'guestbook_entries: %', oldest_date;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'guestbook_entries: Table n''existe pas ou est vide';
    END;
END $$;

-- ============================================================================
-- RÉSUMÉ
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE 'RÉSUMÉ DE LA RECHERCHE';
    RAISE NOTICE '====================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Ce script a vérifié:';
    RAISE NOTICE '1. Les backups automatiques dans la table backups';
    RAISE NOTICE '2. Les logs d''exécution du cron de backup';
    RAISE NOTICE '3. Le contenu actuel de toutes les tables';
    RAISE NOTICE '4. Les dates des données les plus anciennes';
    RAISE NOTICE '';
    RAISE NOTICE 'Si AUCUN backup n''a été trouvé, les seules options sont:';
    RAISE NOTICE '';
    RAISE NOTICE 'OPTION 1: Supabase Dashboard Backups (PITR)';
    RAISE NOTICE '  → Allez dans Supabase Dashboard';
    RAISE NOTICE '  → Database > Backups';
    RAISE NOTICE '  → Cherchez un backup du 27-28/12/2024';
    RAISE NOTICE '';
    RAISE NOTICE 'OPTION 2: Point-in-Time Recovery (Pro/Team plans)';
    RAISE NOTICE '  → Disponible si vous avez un plan payant';
    RAISE NOTICE '  → Settings > Database > Point in Time Recovery';
    RAISE NOTICE '  → Restaurer au 28/12/2024 00:20:00';
    RAISE NOTICE '';
    RAISE NOTICE 'OPTION 3: Contact Supabase Support';
    RAISE NOTICE '  → Si vous aviez un plan Pro/Team';
    RAISE NOTICE '  → Ils peuvent avoir des backups automatiques';
    RAISE NOTICE '  → support@supabase.io';
    RAISE NOTICE '';
    RAISE NOTICE '====================================================================';
END $$;
