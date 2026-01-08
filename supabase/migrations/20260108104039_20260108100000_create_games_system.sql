/*
  # Création du système de jeux (Cartes à gratter & Roue de la fortune)

  1. Nouvelles Tables
    - `scratch_card_games` : Configuration des jeux de cartes à gratter
      - `id` (uuid, primary key)
      - `name` (text) : Nom du jeu
      - `description` (text) : Description
      - `is_active` (boolean) : Jeu actif ou non
      - `start_date` (timestamptz) : Date de début
      - `end_date` (timestamptz) : Date de fin
      - `max_plays_per_user` (integer) : Nombre max de parties par utilisateur
      - `card_design` (jsonb) : Design de la carte (couleurs, images, etc.)
      - `prizes` (jsonb) : Configuration des prix (coupons avec probabilités)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `wheel_games` : Configuration des roues de la fortune
      - `id` (uuid, primary key)
      - `name` (text) : Nom du jeu
      - `description` (text) : Description
      - `is_active` (boolean) : Jeu actif ou non
      - `start_date` (timestamptz) : Date de début
      - `end_date` (timestamptz) : Date de fin
      - `max_plays_per_user` (integer) : Nombre max de parties par utilisateur
      - `wheel_design` (jsonb) : Design de la roue (couleurs, segments, etc.)
      - `segments` (jsonb) : Configuration des segments avec coupons et probabilités
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `game_plays` : Historique des parties jouées
      - `id` (uuid, primary key)
      - `user_id` (uuid) : Référence vers profiles
      - `game_type` (text) : Type de jeu ('scratch_card' ou 'wheel')
      - `game_id` (uuid) : ID du jeu (scratch_card_games ou wheel_games)
      - `prize_won` (text) : Code du coupon gagné
      - `coupon_id` (uuid) : Référence vers coupons
      - `played_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Admins peuvent tout gérer
    - Utilisateurs authentifiés peuvent voir les jeux actifs
    - Utilisateurs authentifiés peuvent enregistrer leurs parties
*/

CREATE TABLE IF NOT EXISTS scratch_card_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT false,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  max_plays_per_user integer DEFAULT 1,
  card_design jsonb DEFAULT '{
    "backgroundColor": "#1a1a1a",
    "scratchColor": "#d4af37",
    "coverImage": null,
    "winImage": null
  }'::jsonb,
  prizes jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wheel_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT false,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  max_plays_per_user integer DEFAULT 1,
  wheel_design jsonb DEFAULT '{
    "backgroundColor": "#1a1a1a",
    "wheelColors": ["#d4af37", "#f5d0a9", "#000000", "#ffc0cb"],
    "centerImage": null
  }'::jsonb,
  segments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_type text NOT NULL CHECK (game_type IN ('scratch_card', 'wheel')),
  game_id uuid NOT NULL,
  prize_won text,
  coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  played_at timestamptz DEFAULT now()
);

ALTER TABLE scratch_card_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active scratch card games"
  ON scratch_card_games
  FOR SELECT
  TO authenticated
  USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Admins can manage scratch card games"
  ON scratch_card_games
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Authenticated users can view active wheel games"
  ON wheel_games
  FOR SELECT
  TO authenticated
  USING (is_active = true AND (start_date IS NULL OR start_date <= now()) AND (end_date IS NULL OR end_date >= now()));

CREATE POLICY "Admins can manage wheel games"
  ON wheel_games
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Users can view their own game plays"
  ON game_plays
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own game plays"
  ON game_plays
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all game plays"
  ON game_plays
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_game_plays_user_id ON game_plays(user_id);
CREATE INDEX IF NOT EXISTS idx_game_plays_game_type ON game_plays(game_type);
CREATE INDEX IF NOT EXISTS idx_game_plays_game_id ON game_plays(game_id);
CREATE INDEX IF NOT EXISTS idx_scratch_card_games_active ON scratch_card_games(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_wheel_games_active ON wheel_games(is_active) WHERE is_active = true;
