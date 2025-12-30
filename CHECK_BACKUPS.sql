-- ============================================================================
-- VÉRIFICATION RAPIDE DES BACKUPS DISPONIBLES
-- ============================================================================
-- 
-- Exécutez ce script dans Supabase SQL Editor pour vérifier
-- si des backups existent dans votre base de données
--
-- Projet: qcqbtmvbvipsxwjlgjvk
-- Date cible: 28/12/2024 00:20:00
--
-- ============================================================================

-- 1. Vérifier les backups dans la table
SELECT 
  '🔍 BACKUPS DANS LA BASE' as info,
  COUNT(*) as total
FROM backups;

-- 2. Lister tous les backups disponibles
SELECT 
  id,
  backup_type,
  status,
  description,
  TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI:SS') as date_creation,
  ROUND(file_size::numeric / 1024 / 1024, 2) || ' MB' as taille
FROM backups
ORDER BY created_at DESC;

-- 3. Afficher un message d'aide
DO $$ 
BEGIN
    RAISE NOTICE '╔══════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║         RÉSULTAT DE LA VÉRIFICATION DES BACKUPS             ║';
    RAISE NOTICE '╚══════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
    
    IF EXISTS (SELECT 1 FROM backups LIMIT 1) THEN
        RAISE NOTICE '✅ Des backups ont été trouvés dans la table backups';
        RAISE NOTICE '   Consultez les résultats ci-dessus pour voir les détails';
        RAISE NOTICE '';
        RAISE NOTICE '📋 Prochaines étapes:';
        RAISE NOTICE '   1. Identifiez le backup le plus proche du 28/12/2024 00:20';
        RAISE NOTICE '   2. Utilisez l''Edge Function "restore-backup" pour restaurer';
        RAISE NOTICE '   3. Ou contactez-moi pour créer un script de restauration';
    ELSE
        RAISE NOTICE '❌ Aucun backup trouvé dans la table backups';
        RAISE NOTICE '';
        RAISE NOTICE '🔧 Options disponibles:';
        RAISE NOTICE '';
        RAISE NOTICE '   OPTION 1: Supabase Dashboard Backups';
        RAISE NOTICE '   ➡️ https://app.supabase.com/project/qcqbtmvbvipsxwjlgjvk/database/backups';
        RAISE NOTICE '   ➡️ Cherchez un backup du 27-28 décembre 2024';
        RAISE NOTICE '';
        RAISE NOTICE '   OPTION 2: Point-in-Time Recovery (Pro/Team)';
        RAISE NOTICE '   ➡️ https://app.supabase.com/project/qcqbtmvbvipsxwjlgjvk/settings/database';
        RAISE NOTICE '   ➡️ Restaurez au 28/12/2024 00:20:00';
        RAISE NOTICE '';
        RAISE NOTICE '   OPTION 3: Contact Supabase Support';
        RAISE NOTICE '   ➡️ support@supabase.io';
        RAISE NOTICE '   ➡️ Demandez les backups automatiques du projet';
        RAISE NOTICE '';
        RAISE NOTICE '📖 Documentation complète:';
        RAISE NOTICE '   ➡️ Consultez le fichier RESUME_SAUVEGARDES_DISPONIBLES.md';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '╚══════════════════════════════════════════════════════════════╝';
END $$;
