/*
  ═══════════════════════════════════════════════════════════════════════════
  SCRIPT DE MIGRATION : WordPress Images → Supabase Storage
  ═══════════════════════════════════════════════════════════════════════════

  Ce script permet de migrer les URLs d'images de WordPress vers Supabase Storage.

  PRÉREQUIS :
  ───────────
  1. Les images doivent être uploadées dans les buckets Supabase Storage :
     - product-images : Pour les images de produits
     - category-images : Pour les images de catégories

  2. La table media_library doit être synchronisée avec les fichiers des buckets
     (via l'API /api/admin/sync-media-library)

  ÉTAT ACTUEL :
  ─────────────
  ✅ Buckets créés : product-images, category-images
  ⚠️  Buckets vides : Aucun fichier uploadé pour le moment
  ✅ Table media_library créée et prête
  ⚠️  Table media_library : Seulement 1 entrée de test

  ÉTAPES NÉCESSAIRES AVANT D'EXÉCUTER CE SCRIPT :
  ────────────────────────────────────────────────
  1. Uploader tous les fichiers images depuis WordPress vers Supabase Storage
  2. Synchroniser media_library via : POST /api/admin/sync-media-library
  3. Vérifier que media_library contient toutes les images
  4. Puis exécuter ce script pour mettre à jour les URLs dans les tables
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 1 : Vérification des données
-- ═══════════════════════════════════════════════════════════════════════════

-- Vérifier le nombre d'images dans media_library
SELECT COUNT(*) as total_images_disponibles FROM media_library;

-- Vérifier quelques exemples d'images disponibles
SELECT filename, url, bucket_name, file_path
FROM media_library
ORDER BY created_at DESC
LIMIT 10;

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 2 : Migration des URLs pour PRODUCTS
-- ═══════════════════════════════════════════════════════════════════════════

/*
  Cette requête met à jour les image_url des produits en cherchant les
  correspondances dans media_library basées sur le nom du fichier.

  Exemple :
  - URL WordPress : https://wp.laboutiquedemorgane.com/wp-content/uploads/2024/12/1000036586.jpg
  - Recherche : 1000036586 dans media_library
  - Remplace par : URL Supabase correspondante (WebP de préférence)
*/

-- IMPORTANT : NE PAS EXÉCUTER AVANT D'AVOIR DES IMAGES DANS media_library !

-- Exemple de requête pour mettre à jour UN produit (TEST)
/*
UPDATE products
SET image_url = (
  SELECT url
  FROM media_library
  WHERE filename ILIKE '%1000036586%'
    AND bucket_name = 'product-images'
  LIMIT 1
)
WHERE image_url LIKE '%1000036586%';
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 3 : Migration MASSIVE des URLs de produits
-- ═══════════════════════════════════════════════════════════════════════════

/*
  Cette fonction extrait le nom de fichier depuis une URL WordPress et
  cherche la correspondance dans media_library.

  ATTENTION : À exécuter seulement quand media_library est remplie !
*/

-- Fonction pour extraire le nom de fichier d'une URL
CREATE OR REPLACE FUNCTION extract_filename_from_url(url_text text)
RETURNS text AS $$
BEGIN
  -- Extrait le nom de fichier sans extension depuis l'URL
  RETURN regexp_replace(
    substring(url_text from '[^/]+$'),
    '\.[^.]+$',
    ''
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Fonction pour trouver l'image correspondante dans media_library
CREATE OR REPLACE FUNCTION find_supabase_image_url(wordpress_url text, bucket text DEFAULT 'product-images')
RETURNS text AS $$
DECLARE
  filename_base text;
  supabase_url text;
BEGIN
  -- Extraire le nom de fichier sans extension
  filename_base := extract_filename_from_url(wordpress_url);

  -- Chercher dans media_library (préférence pour WebP)
  SELECT url INTO supabase_url
  FROM media_library
  WHERE bucket_name = bucket
    AND (
      filename ILIKE '%' || filename_base || '%'
    )
  ORDER BY
    CASE WHEN filename LIKE '%.webp' THEN 1 ELSE 2 END,
    created_at DESC
  LIMIT 1;

  RETURN COALESCE(supabase_url, wordpress_url);
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 4 : Exécuter la migration (QUAND PRÊT)
-- ═══════════════════════════════════════════════════════════════════════════

-- DÉCOMMENTER QUAND media_library EST REMPLIE :

/*
-- Migration des images de produits
UPDATE products
SET image_url = find_supabase_image_url(image_url, 'product-images')
WHERE image_url LIKE '%wp.laboutiquedemorgane%'
   OR image_url LIKE '%wordpress%';

-- Migration des images de catégories
UPDATE categories
SET image_url = find_supabase_image_url(image_url, 'category-images')
WHERE image_url LIKE '%wp.laboutiquedemorgane%'
   OR image_url LIKE '%wordpress%';

-- Migration des images de home_categories
UPDATE home_categories
SET image_url = find_supabase_image_url(image_url, 'category-images')
WHERE image_url LIKE '%wp.laboutiquedemorgane%'
   OR image_url LIKE '%wordpress%';

-- Migration des images de home_slides
UPDATE home_slides
SET image_url = find_supabase_image_url(image_url, 'product-images')
WHERE image_url LIKE '%wp.laboutiquedemorgane%'
   OR image_url LIKE '%wordpress%';
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 5 : Vérification après migration
-- ═══════════════════════════════════════════════════════════════════════════

-- Compter les URLs WordPress restantes dans products
SELECT COUNT(*) as urls_wordpress_restantes
FROM products
WHERE image_url LIKE '%wp.laboutiquedemorgane%'
   OR image_url LIKE '%wordpress%';

-- Compter les URLs Supabase dans products
SELECT COUNT(*) as urls_supabase
FROM products
WHERE image_url LIKE '%supabase%';

-- ═══════════════════════════════════════════════════════════════════════════
-- NOTES IMPORTANTES
-- ═══════════════════════════════════════════════════════════════════════════

/*
  ÉTAT ACTUEL DU SYSTÈME :
  ────────────────────────
  ✅ Schémas de tables : Tous corrects, pas de colonnes manquantes
  ✅ Buckets Storage : Créés (product-images, category-images)
  ⚠️  Fichiers : Buckets vides (0 fichiers uploadés)
  ⚠️  media_library : 1 entrée de test uniquement
  ✅ URLs WordPress : Aucune URL WordPress dans la base actuellement

  CONCLUSION :
  ────────────
  Les produits sont chargés dynamiquement depuis WooCommerce en temps réel.
  Pour migrer vers Supabase, il faut :

  1. Uploader les images WordPress vers Supabase Storage
  2. Synchroniser media_library
  3. Exécuter ce script de migration
  4. Mettre à jour le code frontend pour utiliser les URLs Supabase

  ERREURS 400 RÉSOLUES :
  ──────────────────────
  ✅ Migration appliquée : fix_400_errors_postgrest_cache_reload.sql
  ✅ Colonnes vérifiées : Toutes les colonnes nécessaires existent
  ✅ PostgREST rechargé : Cache invalidé
*/
