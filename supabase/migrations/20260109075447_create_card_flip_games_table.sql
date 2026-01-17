/*
  # Système de jeu de cartes à retourner

  1. Nouvelles tables
    - `card_flip_games`
      - `id` (uuid, clé primaire)
      - `name` (text) - Nom du jeu
      - `description` (text) - Description
      - `coupon_id` (uuid) - Référence au coupon à gagner
      - `is_active` (boolean) - Jeu actif ou non
      - `start_date` (timestamptz) - Date de début
      - `end_date` (timestamptz) - Date de fin
      - `max_plays_per_user` (integer) - Nombre max de parties par utilisateur
      - `total_winners` (integer) - Nombre total de gagnants
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `card_flip_game_plays`
      - `id` (uuid, clé primaire)
      - `game_id` (uuid) - Référence au jeu
      - `user_id` (uuid) - Référence à l'utilisateur
      - `has_won` (boolean) - A gagné ou non
      - `coupon_code` (text) - Code du coupon si gagné
      - `played_at` (timestamptz)
  
  2. Sécurité
    - Enable RLS sur les deux tables
    - Policies pour lecture publique des jeux actifs
    - Policies admin pour gestion complète
    - Policies utilisateur pour jouer et voir leur historique
*/

-- Table des jeux de cartes
CREATE TABLE IF NOT EXISTS card_flip_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  is_active boolean DEFAULT false,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  max_plays_per_user integer DEFAULT 1,
  total_winners integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des parties jouées
CREATE TABLE IF NOT EXISTS card_flip_game_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid REFERENCES card_flip_games(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  has_won boolean DEFAULT false,
  coupon_code text,
  played_at timestamptz DEFAULT now()
);

-- Index pour optimisation
CREATE INDEX IF NOT EXISTS idx_card_flip_games_active ON card_flip_games(is_active, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_card_flip_game_plays_user ON card_flip_game_plays(user_id, game_id);
CREATE INDEX IF NOT EXISTS idx_card_flip_game_plays_game ON card_flip_game_plays(game_id);

-- Enable RLS
ALTER TABLE card_flip_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_flip_game_plays ENABLE ROW LEVEL SECURITY;

-- Policies pour card_flip_games
CREATE POLICY "Tout le monde peut voir les jeux actifs"
  ON card_flip_games FOR SELECT
  USING (is_active = true AND start_date <= now() AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Les admins peuvent tout voir"
  ON card_flip_games FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Les admins peuvent créer des jeux"
  ON card_flip_games FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Les admins peuvent modifier des jeux"
  ON card_flip_games FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Les admins peuvent supprimer des jeux"
  ON card_flip_games FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policies pour card_flip_game_plays
CREATE POLICY "Les utilisateurs peuvent voir leur historique"
  ON card_flip_game_plays FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Les admins peuvent voir tous les historiques"
  ON card_flip_game_plays FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Les utilisateurs peuvent enregistrer leurs parties"
  ON card_flip_game_plays FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_card_flip_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_card_flip_games_updated_at ON card_flip_games;
CREATE TRIGGER trigger_update_card_flip_games_updated_at
  BEFORE UPDATE ON card_flip_games
  FOR EACH ROW
  EXECUTE FUNCTION update_card_flip_games_updated_at();
