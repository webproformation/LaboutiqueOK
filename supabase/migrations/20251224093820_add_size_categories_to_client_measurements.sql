/*
  # Ajouter les catégories de tailles aux mensurations clients

  1. Modifications
    - Ajoute `preferred_size_bottom` (text, nullable) : PETITES TAILLES (36 au 44) ou GRANDES TAILLES (46-54)
    - Ajoute `preferred_size_top` (text, nullable) : PETITES TAILLES (36 au 44) ou GRANDES TAILLES (46-54)
    - Ces champs remplacent le système XS-XXL par les nouvelles catégories de tailles utilisées dans WooCommerce
  
  2. Notes
    - Les champs sont nullable pour ne pas impacter les données existantes
    - L'ancien champ `preferred_size` est conservé pour compatibilité
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_measurements' AND column_name = 'preferred_size_bottom'
  ) THEN
    ALTER TABLE client_measurements ADD COLUMN preferred_size_bottom text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_measurements' AND column_name = 'preferred_size_top'
  ) THEN
    ALTER TABLE client_measurements ADD COLUMN preferred_size_top text;
  END IF;
END $$;