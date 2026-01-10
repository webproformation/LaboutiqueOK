/*
  # Correction Policy INSERT pour card_flip_games

  1. Problème
    - Erreur 400 lors de l'insertion dans card_flip_games
    - La policy admin doit avoir WITH CHECK

  2. Solution
    - Supprimer et recréer la policy INSERT avec WITH CHECK correct
    
  3. Sécurité
    - Seuls les admins peuvent créer des jeux
*/

-- Supprimer l'ancienne policy
DROP POLICY IF EXISTS "Les admins peuvent créer des jeux" ON card_flip_games;

-- Recréer avec WITH CHECK
CREATE POLICY "Les admins peuvent créer des jeux"
  ON card_flip_games FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
