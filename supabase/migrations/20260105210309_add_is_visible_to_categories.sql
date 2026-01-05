/*
  # Ajouter le champ is_visible aux catégories
  
  1. Modifications
    - Ajoute la colonne `is_visible` (boolean, default true) à la table categories
    - Définit les catégories principales visibles selon les besoins
  
  2. Catégories visibles
    - Nouveautés
    - Mode
    - Les looks de Morgane
    - Maison
    - Beauté & Senteurs
    - Bonnes affaires
    - Live Shopping et Replay
*/

-- Ajouter la colonne is_visible
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'is_visible'
  ) THEN
    ALTER TABLE categories ADD COLUMN is_visible BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Masquer toutes les catégories principales par défaut
UPDATE categories 
SET is_visible = false 
WHERE parent_id IS NULL;

-- Rendre visibles uniquement les catégories principales souhaitées
UPDATE categories 
SET is_visible = true 
WHERE parent_id IS NULL 
AND slug IN (
  'nouveautes',
  'mode',
  'les-looks-de-morgane',
  'maison',
  'beaute-senteurs',
  'bonnes-affaires',
  'live-shopping-et-replay'
);

-- Toutes les sous-catégories restent visibles
UPDATE categories 
SET is_visible = true 
WHERE parent_id IS NOT NULL;
