-- SCRIPT: Remplir les color_code pour les 14 couleurs
-- Date: 03 Janvier 2026
-- Projet: qcqbtmvbvipsxwjlgjvk.supabase.co

-- Assurez-vous d'avoir la colonne color_code (créée par la migration)

-- 1. IDENTIFIER l'attribut "Couleur"
DO $$
DECLARE
  couleur_attr_id uuid;
BEGIN
  -- Trouver l'ID de l'attribut Couleur
  SELECT id INTO couleur_attr_id
  FROM product_attributes
  WHERE slug IN ('pa_couleur', 'couleur', 'pa_color', 'color')
  LIMIT 1;

  IF couleur_attr_id IS NULL THEN
    RAISE NOTICE '⚠️  Attribut Couleur non trouvé dans product_attributes';
    RAISE NOTICE '   Vérifier le slug: SELECT * FROM product_attributes WHERE type = ''color'';';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Attribut Couleur trouvé: %', couleur_attr_id;

  -- 2. REMPLIR les color_code pour chaque couleur
  -- Adapter les slugs selon vos données réelles

  -- Rouge
  UPDATE product_attribute_terms 
  SET color_code = '#FF5733'
  WHERE attribute_id = couleur_attr_id 
    AND slug IN ('rouge', 'red', 'pa_rouge')
    AND color_code IS NULL;
  RAISE NOTICE 'Rouge: color_code = #FF5733';

  -- Bleu
  UPDATE product_attribute_terms 
  SET color_code = '#3357FF'
  WHERE attribute_id = couleur_attr_id 
    AND slug IN ('bleu', 'blue', 'pa_bleu')
    AND color_code IS NULL;
  RAISE NOTICE 'Bleu: color_code = #3357FF';

  -- Vert
  UPDATE product_attribute_terms 
  SET color_code = '#33FF57'
  WHERE attribute_id = couleur_attr_id 
    AND slug IN ('vert', 'green', 'pa_vert')
    AND color_code IS NULL;
  RAISE NOTICE 'Vert: color_code = #33FF57';

  -- Jaune
  UPDATE product_attribute_terms 
  SET color_code = '#FFD700'
  WHERE attribute_id = couleur_attr_id 
    AND slug IN ('jaune', 'yellow', 'pa_jaune')
    AND color_code IS NULL;
  RAISE NOTICE 'Jaune: color_code = #FFD700';

  -- Orange
  UPDATE product_attribute_terms 
  SET color_code = '#FF8C00'
  WHERE attribute_id = couleur_attr_id 
    AND slug IN ('orange', 'pa_orange')
    AND color_code IS NULL;
  RAISE NOTICE 'Orange: color_code = #FF8C00';

  -- Rose
  UPDATE product_attribute_terms 
  SET color_code = '#FF69B4'
  WHERE attribute_id = couleur_attr_id 
    AND slug IN ('rose', 'pink', 'pa_rose')
    AND color_code IS NULL;
  RAISE NOTICE 'Rose: color_code = #FF69B4';

  -- Violet
  UPDATE product_attribute_terms 
  SET color_code = '#8A2BE2'
  WHERE attribute_id = couleur_attr_id 
    AND slug IN ('violet', 'purple', 'pa_violet')
    AND color_code IS NULL;
  RAISE NOTICE 'Violet: color_code = #8A2BE2';

  -- Marron
  UPDATE product_attribute_terms 
  SET color_code = '#8B4513'
  WHERE attribute_id = couleur_attr_id 
    AND slug IN ('marron', 'brown', 'pa_marron')
    AND color_code IS NULL;
  RAISE NOTICE 'Marron: color_code = #8B4513';

  -- Noir
  UPDATE product_attribute_terms 
  SET color_code = '#000000'
  WHERE attribute_id = couleur_attr_id 
    AND slug IN ('noir', 'black', 'pa_noir')
    AND color_code IS NULL;
  RAISE NOTICE 'Noir: color_code = #000000';

  -- Blanc
  UPDATE product_attribute_terms 
  SET color_code = '#FFFFFF'
  WHERE attribute_id = couleur_attr_id 
    AND slug IN ('blanc', 'white', 'pa_blanc')
    AND color_code IS NULL;
  RAISE NOTICE 'Blanc: color_code = #FFFFFF';

  -- Gris
  UPDATE product_attribute_terms 
  SET color_code = '#808080'
  WHERE attribute_id = couleur_attr_id 
    AND slug IN ('gris', 'gray', 'grey', 'pa_gris')
    AND color_code IS NULL;
  RAISE NOTICE 'Gris: color_code = #808080';

  -- Beige
  UPDATE product_attribute_terms 
  SET color_code = '#F5F5DC'
  WHERE attribute_id = couleur_attr_id 
    AND slug IN ('beige', 'pa_beige')
    AND color_code IS NULL;
  RAISE NOTICE 'Beige: color_code = #F5F5DC';

  -- Doré
  UPDATE product_attribute_terms 
  SET color_code = '#FFD700'
  WHERE attribute_id = couleur_attr_id 
    AND slug IN ('dore', 'gold', 'pa_dore')
    AND color_code IS NULL;
  RAISE NOTICE 'Doré: color_code = #FFD700';

  -- Argenté
  UPDATE product_attribute_terms 
  SET color_code = '#C0C0C0'
  WHERE attribute_id = couleur_attr_id 
    AND slug IN ('argente', 'silver', 'pa_argente')
    AND color_code IS NULL;
  RAISE NOTICE 'Argenté: color_code = #C0C0C0';

  -- 3. VÉRIFIER le résultat
  RAISE NOTICE '';
  RAISE NOTICE '📊 RÉSUMÉ:';
  RAISE NOTICE 'Total couleurs avec color_code: %', (
    SELECT COUNT(*) FROM product_attribute_terms 
    WHERE attribute_id = couleur_attr_id AND color_code IS NOT NULL
  );
  RAISE NOTICE 'Total couleurs sans color_code: %', (
    SELECT COUNT(*) FROM product_attribute_terms 
    WHERE attribute_id = couleur_attr_id AND color_code IS NULL
  );

END $$;

-- VÉRIFICATION FINALE
SELECT 
  name,
  slug,
  value,
  color_code,
  CASE 
    WHEN color_code IS NOT NULL THEN '✅'
    ELSE '❌'
  END as status
FROM product_attribute_terms
WHERE attribute_id = (
  SELECT id FROM product_attributes 
  WHERE slug IN ('pa_couleur', 'couleur', 'pa_color', 'color')
  LIMIT 1
)
ORDER BY name;
