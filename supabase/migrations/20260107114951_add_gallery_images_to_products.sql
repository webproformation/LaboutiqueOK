/*
  # Ajouter colonne gallery_images à la table products

  1. Modification
    - Ajouter la colonne `gallery_images` de type JSONB à la table `products`
    - Cette colonne stockera un tableau d'URLs d'images pour la galerie produit
    - Valeur par défaut : tableau JSON vide

  2. Notes
    - Format attendu : ["url1", "url2", "url3"]
    - Permet de stocker plusieurs images pour chaque produit
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'gallery_images'
  ) THEN
    ALTER TABLE products ADD COLUMN gallery_images JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
