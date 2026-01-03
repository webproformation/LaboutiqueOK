/*
  MISE À JOUR DÉFINITIVE DES URLs D'IMAGES

  Objectif : Associer les images de media_library aux produits et catégories
  en extrayant l'ID WooCommerce depuis le nom de fichier.

  Format des fichiers :
  - Produits : product-[ID]-[timestamp].webp
  - Catégories : category-[ID]-[timestamp].jpg
*/

-- ============================================================
-- ÉTAPE 1: Mise à jour des PRODUITS
-- ============================================================

-- Compter combien de produits ont une image dans media_library
SELECT
  'AVANT UPDATE - Produits avec image' AS info,
  COUNT(*) AS total
FROM products
WHERE image_url IS NOT NULL AND image_url != '';

-- UPDATE des produits avec les URLs Supabase
WITH extracted_ids AS (
  SELECT
    id,
    filename,
    url,
    bucket_name,
    -- Extraction de l'ID numérique entre 'product-' et '-timestamp'
    CAST(
      SPLIT_PART(
        SPLIT_PART(filename, 'product-', 2),
        '-',
        1
      ) AS INTEGER
    ) AS product_id
  FROM media_library
  WHERE filename LIKE 'product-%'
    AND bucket_name = 'product-images'
)
UPDATE products
SET
  image_url = extracted_ids.url,
  updated_at = NOW()
FROM extracted_ids
WHERE products.id = extracted_ids.product_id;

-- Vérifier le résultat
SELECT
  'APRÈS UPDATE - Produits mis à jour' AS info,
  COUNT(*) AS total
FROM products p
INNER JOIN media_library m ON (
  CAST(
    SPLIT_PART(SPLIT_PART(m.filename, 'product-', 2), '-', 1)
    AS INTEGER
  ) = p.id
  AND m.filename LIKE 'product-%'
  AND m.bucket_name = 'product-images'
);

-- ============================================================
-- ÉTAPE 2: Mise à jour des CATÉGORIES
-- ============================================================

-- Vérifier si la table categories existe
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'categories'
  ) THEN
    -- Compter combien de catégories ont une image dans media_library
    RAISE NOTICE 'Table categories trouvée, mise à jour en cours...';

    -- UPDATE des catégories avec les URLs Supabase
    WITH extracted_cat_ids AS (
      SELECT
        id,
        filename,
        url,
        bucket_name,
        -- Extraction de l'ID numérique entre 'category-' et '-timestamp'
        CAST(
          SPLIT_PART(
            SPLIT_PART(filename, 'category-', 2),
            '-',
            1
          ) AS INTEGER
        ) AS category_id
      FROM media_library
      WHERE filename LIKE 'category-%'
        AND bucket_name = 'category-images'
    )
    UPDATE categories
    SET
      image_url = extracted_cat_ids.url,
      updated_at = NOW()
    FROM extracted_cat_ids
    WHERE categories.id = extracted_cat_ids.category_id;

    RAISE NOTICE 'Catégories mises à jour avec succès';
  ELSE
    RAISE NOTICE 'Table categories non trouvée, ignorée';
  END IF;
END $$;

-- ============================================================
-- ÉTAPE 3: RAPPORT FINAL
-- ============================================================

SELECT
  '=== RAPPORT FINAL ===' AS section,
  '' AS details
UNION ALL
SELECT
  'Total images produits dans media_library' AS section,
  COUNT(*)::TEXT AS details
FROM media_library
WHERE filename LIKE 'product-%'
  AND bucket_name = 'product-images'
UNION ALL
SELECT
  'Total produits avec image Supabase' AS section,
  COUNT(*)::TEXT AS details
FROM products
WHERE image_url LIKE '%supabase.co/storage%'
UNION ALL
SELECT
  'Total images catégories dans media_library' AS section,
  COUNT(*)::TEXT AS details
FROM media_library
WHERE filename LIKE 'category-%'
  AND bucket_name = 'category-images'
UNION ALL
SELECT
  'Total catégories avec image Supabase' AS section,
  COALESCE(
    (SELECT COUNT(*)::TEXT
     FROM categories
     WHERE image_url LIKE '%supabase.co/storage%'),
    'Table categories absente'
  ) AS details;
