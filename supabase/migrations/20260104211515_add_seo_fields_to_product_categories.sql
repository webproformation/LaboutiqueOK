/*
  # Ajouter les champs SEO aux catégories de produits

  1. Modifications
    - Ajout de `meta_title` (text) - Titre pour les moteurs de recherche
    - Ajout de `meta_description` (text) - Description pour les moteurs de recherche
    - Ajout de `seo_keywords` (text) - Mots-clés SEO
    
  2. Notes
    - Les champs sont optionnels et peuvent être laissés vides
    - Si vides, les valeurs par défaut seront générées depuis name et description
*/

-- Ajouter les champs SEO à la table product_categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_categories' AND column_name = 'meta_title'
  ) THEN
    ALTER TABLE product_categories ADD COLUMN meta_title text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_categories' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE product_categories ADD COLUMN meta_description text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_categories' AND column_name = 'seo_keywords'
  ) THEN
    ALTER TABLE product_categories ADD COLUMN seo_keywords text;
  END IF;
END $$;
