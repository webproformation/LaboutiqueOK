/*
  # Ajout des colonnes de gestion de stock

  1. Modifications
    - Ajout de la colonne `manage_stock` (boolean) à la table `products`
    - Ajout de la colonne `stock_status` (text) à la table `products`
  
  2. Valeurs par défaut
    - `manage_stock` : false (désactivé par défaut)
    - `stock_status` : 'instock' (en stock par défaut)
  
  3. Notes importantes
    - Utilise IF NOT EXISTS pour éviter les erreurs si les colonnes existent déjà
    - Compatible avec les données existantes
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'manage_stock'
  ) THEN
    ALTER TABLE products ADD COLUMN manage_stock boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock_status'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_status text DEFAULT 'instock';
  END IF;
END $$;