/*
  # Système de tailles numériques et familles de couleurs

  1. Modifications sur product_variations
    - Ajout de `size_min` (integer) : Taille minimale de l'intervalle
    - Ajout de `size_max` (integer) : Taille maximale de l'intervalle
    
  2. Modifications sur product_attribute_terms
    - Ajout de `color_family` (text) : Famille de couleur pour le regroupement des filtres
    
  3. Modifications sur profiles
    - Ajout de `user_size` (integer) : Taille habituelle de l'utilisateur
    
  4. Nouveaux attributs produits
    - Ajout de l'attribut "Confort" (boolean/tag)
    - Ajout de l'attribut "Coupe" (select)
*/

-- Ajouter les colonnes de taille numérique sur product_variations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variations' AND column_name = 'size_min'
  ) THEN
    ALTER TABLE product_variations ADD COLUMN size_min integer DEFAULT NULL;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_variations' AND column_name = 'size_max'
  ) THEN
    ALTER TABLE product_variations ADD COLUMN size_max integer DEFAULT NULL;
  END IF;
END $$;

-- Ajouter la colonne color_family sur product_attribute_terms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_attribute_terms' AND column_name = 'color_family'
  ) THEN
    ALTER TABLE product_attribute_terms ADD COLUMN color_family text DEFAULT NULL;
  END IF;
END $$;

-- Ajouter la colonne user_size sur profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'user_size'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_size integer DEFAULT NULL;
  END IF;
END $$;

-- Créer l'attribut "Confort" s'il n'existe pas
DO $$
DECLARE
  v_confort_id uuid;
BEGIN
  SELECT id INTO v_confort_id
  FROM product_attributes
  WHERE slug = 'confort'
  LIMIT 1;
  
  IF v_confort_id IS NULL THEN
    INSERT INTO product_attributes (name, slug, type, is_visible, order_by)
    VALUES ('Confort', 'confort', 'select', true, 50)
    RETURNING id INTO v_confort_id;
    
    -- Ajouter les termes pour Confort
    INSERT INTO product_attribute_terms (attribute_id, name, slug, value, order_by)
    VALUES 
      (v_confort_id, 'Extensible / Stretch', 'extensible-stretch', 'Extensible', 1),
      (v_confort_id, 'Standard', 'standard', 'Standard', 2);
  END IF;
END $$;

-- Créer l'attribut "Coupe" s'il n'existe pas
DO $$
DECLARE
  v_coupe_id uuid;
BEGIN
  SELECT id INTO v_coupe_id
  FROM product_attributes
  WHERE slug = 'coupe'
  LIMIT 1;
  
  IF v_coupe_id IS NULL THEN
    INSERT INTO product_attributes (name, slug, type, is_visible, order_by)
    VALUES ('Coupe', 'coupe', 'select', true, 51)
    RETURNING id INTO v_coupe_id;
    
    -- Ajouter les termes pour Coupe
    INSERT INTO product_attribute_terms (attribute_id, name, slug, value, order_by)
    VALUES 
      (v_coupe_id, 'Oversize', 'oversize', 'Oversize', 1),
      (v_coupe_id, 'Ajusté', 'ajuste', 'Ajusté', 2),
      (v_coupe_id, 'Standard', 'standard-coupe', 'Standard', 3);
  END IF;
END $$;

-- Ajouter un index pour optimiser les requêtes de taille
CREATE INDEX IF NOT EXISTS idx_product_variations_size_range 
ON product_variations (size_min, size_max) 
WHERE size_min IS NOT NULL AND size_max IS NOT NULL;

-- Ajouter un index pour color_family
CREATE INDEX IF NOT EXISTS idx_product_attribute_terms_color_family 
ON product_attribute_terms (color_family) 
WHERE color_family IS NOT NULL;