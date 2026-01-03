/*
  ═══════════════════════════════════════════════════════════════════════════
  DIAGNOSTIC COMPLET - STORAGE BUCKETS
  ═══════════════════════════════════════════════════════════════════════════

  Ce script vérifie l'état des buckets Storage et des fichiers.

  EXÉCUTER CE SCRIPT POUR DIAGNOSTIQUER POURQUOI LA SYNC NE FONCTIONNE PAS.
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. LISTE DES BUCKETS DISPONIBLES
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
  '════════════════════════════════════════════════════════════════' as separator,
  'BUCKETS DISPONIBLES' as title;

SELECT
  id,
  name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
ORDER BY name;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. STATISTIQUES DES FICHIERS PAR BUCKET
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
  '════════════════════════════════════════════════════════════════' as separator,
  'STATISTIQUES PAR BUCKET' as title;

SELECT
  bucket_id,
  COUNT(*) as total_files,
  SUM(COALESCE((metadata->>'size')::bigint, 0)) as total_bytes,
  pg_size_pretty(SUM(COALESCE((metadata->>'size')::bigint, 0))) as total_size,
  MIN(created_at) as oldest_file,
  MAX(created_at) as newest_file
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. FICHIERS DANS product-images (20 premiers)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
  '════════════════════════════════════════════════════════════════' as separator,
  'FICHIERS DANS product-images (20 premiers)' as title;

SELECT
  id,
  name,
  bucket_id,
  COALESCE((metadata->>'size')::bigint, 0) as size_bytes,
  metadata->>'mimetype' as mime_type,
  created_at
FROM storage.objects
WHERE bucket_id = 'product-images'
ORDER BY created_at DESC
LIMIT 20;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. FICHIERS DANS category-images (20 premiers)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
  '════════════════════════════════════════════════════════════════' as separator,
  'FICHIERS DANS category-images (20 premiers)' as title;

SELECT
  id,
  name,
  bucket_id,
  COALESCE((metadata->>'size')::bigint, 0) as size_bytes,
  metadata->>'mimetype' as mime_type,
  created_at
FROM storage.objects
WHERE bucket_id = 'category-images'
ORDER BY created_at DESC
LIMIT 20;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. FICHIERS DANS SOUS-DOSSIERS (products/ et categories/)
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
  '════════════════════════════════════════════════════════════════' as separator,
  'FICHIERS PAR SOUS-DOSSIER' as title;

SELECT
  bucket_id,
  CASE
    WHEN name LIKE 'products/%' THEN 'products/'
    WHEN name LIKE 'categories/%' THEN 'categories/'
    ELSE 'root'
  END as folder,
  COUNT(*) as file_count
FROM storage.objects
WHERE bucket_id IN ('product-images', 'category-images')
GROUP BY bucket_id, folder
ORDER BY bucket_id, folder;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. ÉTAT DE LA TABLE media_library
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
  '════════════════════════════════════════════════════════════════' as separator,
  'ÉTAT DE LA TABLE media_library' as title;

SELECT
  COUNT(*) as total_entries,
  COUNT(DISTINCT bucket_name) as unique_buckets,
  SUM(file_size) as total_bytes,
  pg_size_pretty(SUM(file_size)) as total_size,
  COUNT(*) FILTER (WHERE is_orphan = true) as orphans,
  COUNT(*) FILTER (WHERE is_orphan = false) as used_files
FROM media_library;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. VÉRIFICATION DES POLICIES RLS SUR media_library
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
  '════════════════════════════════════════════════════════════════' as separator,
  'RLS POLICIES - media_library' as title;

SELECT
  policyname,
  cmd as command,
  roles,
  CASE WHEN qual IS NOT NULL THEN 'Oui' ELSE 'Non' END as has_using,
  CASE WHEN with_check IS NOT NULL THEN 'Oui' ELSE 'Non' END as has_with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'media_library'
ORDER BY cmd, policyname;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. VÉRIFICATION DES POLICIES STORAGE
-- ═══════════════════════════════════════════════════════════════════════════

SELECT
  '════════════════════════════════════════════════════════════════' as separator,
  'STORAGE POLICIES' as title;

SELECT
  name as policy_name,
  bucket_id,
  definition
FROM storage.policies
WHERE bucket_id IN ('product-images', 'category-images')
ORDER BY bucket_id, name;

-- ═══════════════════════════════════════════════════════════════════════════
-- RÉSUMÉ ET RECOMMANDATIONS
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  v_storage_files_product INT;
  v_storage_files_category INT;
  v_media_library_count INT;
BEGIN
  -- Compter fichiers Storage
  SELECT COUNT(*) INTO v_storage_files_product
  FROM storage.objects
  WHERE bucket_id = 'product-images';

  SELECT COUNT(*) INTO v_storage_files_category
  FROM storage.objects
  WHERE bucket_id = 'category-images';

  -- Compter entrées media_library
  SELECT COUNT(*) INTO v_media_library_count
  FROM media_library;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'RÉSUMÉ DU DIAGNOSTIC';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Fichiers dans Storage product-images: %', v_storage_files_product;
  RAISE NOTICE 'Fichiers dans Storage category-images: %', v_storage_files_category;
  RAISE NOTICE 'Entrées dans media_library: %', v_media_library_count;
  RAISE NOTICE '';

  IF v_storage_files_product = 0 AND v_storage_files_category = 0 THEN
    RAISE NOTICE '❌ PROBLÈME: Aucun fichier dans les buckets Storage';
    RAISE NOTICE '   SOLUTION: Uploadez des images d''abord';
  ELSIF v_media_library_count = 0 THEN
    RAISE NOTICE '⚠️  PROBLÈME: Les fichiers existent dans Storage mais pas dans media_library';
    RAISE NOTICE '   SOLUTION: Lancez la synchronisation depuis /admin/mediatheque';
    RAISE NOTICE '   VÉRIFIEZ: Les policies RLS ne bloquent pas les insertions';
  ELSIF v_media_library_count < (v_storage_files_product + v_storage_files_category) THEN
    RAISE NOTICE '⚠️  ATTENTION: Certains fichiers Storage ne sont pas dans media_library';
    RAISE NOTICE '   Storage total: %', v_storage_files_product + v_storage_files_category;
    RAISE NOTICE '   media_library: %', v_media_library_count;
    RAISE NOTICE '   SOLUTION: Relancez la synchronisation';
  ELSE
    RAISE NOTICE '✅ OK: Tous les fichiers sont synchronisés';
  END IF;

  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
