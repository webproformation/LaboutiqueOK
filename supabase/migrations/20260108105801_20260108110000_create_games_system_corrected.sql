/*
  # Système de jeux interactifs (cartes à gratter & roue de la chance) - Version corrigée
  
  1. Nouvelles tables
    - `scratch_card_games`
      - Configuration des jeux de cartes à gratter
      - Design personnalisable avec couleurs de la charte
      - Liste des prix avec coupons et probabilités
    
    - `wheel_games`
      - Configuration des jeux de roue de la chance
      - Segments personnalisables avec couleurs
      - Coupons associés avec probabilités
    
    - `game_plays`
      - Historique des parties jouées
      - Suivi des gains et coupons attribués
      - Limite du nombre de parties par utilisateur
  
  2. Sécurité
    - Enable RLS sur toutes les tables
    - Lecture publique pour jeux actifs
    - Gestion admin uniquement pour création/modification
    - Utilisateurs peuvent voir leurs propres parties
*/

CREATE TABLE IF NOT EXISTS scratch_card_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT false,
  start_date timestamptz,
  end_date timestamptz,
  max_plays_per_user integer DEFAULT 1,
  card_design jsonb DEFAULT '{
    "backgroundColor": "#1a1a1a",
    "scratchColor": "#d4af37"
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
  start_date timestamptz,
  end_date timestamptz,
  max_plays_per_user integer DEFAULT 1,
  wheel_design jsonb DEFAULT '{
    "backgroundColor": "#1a1a1a",
    "wheelColors": ["#d4af37", "#f5d0a9", "#000000", "#ffc0cb", "#1a1a1a", "#ffffff"]
  }'::jsonb,
  segments jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type text NOT NULL CHECK (game_type IN ('scratch_card', 'wheel')),
  game_id uuid NOT NULL,
  prize_won text,
  coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
  played_at timestamptz DEFAULT now()
);

ALTER TABLE scratch_card_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_plays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active scratch card games"
  ON scratch_card_games
  FOR SELECT
  TO public
  USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

CREATE POLICY "Authenticated users can view all scratch card games"
  ON scratch_card_games
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage scratch card games"
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

CREATE POLICY "Public can view active wheel games"
  ON wheel_games
  FOR SELECT
  TO public
  USING (
    is_active = true 
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

CREATE POLICY "Authenticated users can view all wheel games"
  ON wheel_games
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage wheel games"
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

CREATE POLICY "Users can view own game plays"
  ON game_plays
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game plays"
  ON game_plays
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all game plays"
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
CREATE INDEX IF NOT EXISTS idx_game_plays_game_id ON game_plays(game_id);
CREATE INDEX IF NOT EXISTS idx_game_plays_game_type ON game_plays(game_type);
CREATE INDEX IF NOT EXISTS idx_scratch_card_games_active ON scratch_card_games(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_wheel_games_active ON wheel_games(is_active) WHERE is_active = true;
