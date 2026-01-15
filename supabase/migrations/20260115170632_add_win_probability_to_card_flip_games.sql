/*
  # Ajout du système de probabilités pour Card Flip Game
  
  1. Modifications
    - Ajouter la colonne `win_probability` à `card_flip_games`
      - Type: decimal (0-100)
      - Représente le pourcentage de chance de gagner
      - Par défaut: 33.33% (1 chance sur 3)
  
  2. Logique
    - L'admin peut définir la probabilité de gagner pour chaque jeu
    - L'API utilisera cette valeur pour le tirage au sort pondéré
*/

-- Ajouter la colonne win_probability si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'card_flip_games' AND column_name = 'win_probability'
  ) THEN
    ALTER TABLE card_flip_games 
    ADD COLUMN win_probability decimal(5,2) DEFAULT 33.33 CHECK (win_probability >= 0 AND win_probability <= 100);
  END IF;
END $$;

-- Mettre à jour les jeux existants avec la valeur par défaut
UPDATE card_flip_games
SET win_probability = 33.33
WHERE win_probability IS NULL;