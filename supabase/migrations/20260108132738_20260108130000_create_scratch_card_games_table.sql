/*
  # Création table scratch_card_games manquante
  
  1. Nouvelle table
    - `scratch_card_games`
      - Configuration des jeux de cartes à gratter
      - Design personnalisable avec couleurs
      - Liste des prix avec coupons et probabilités
  
  2. Sécurité
    - Enable RLS
    - Lecture publique pour jeux actifs
    - Gestion admin uniquement
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

ALTER TABLE scratch_card_games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active scratch card games" ON scratch_card_games;
DROP POLICY IF EXISTS "Authenticated users can view all scratch card games" ON scratch_card_games;
DROP POLICY IF EXISTS "Admin can manage scratch card games" ON scratch_card_games;

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

CREATE INDEX IF NOT EXISTS idx_scratch_card_games_active ON scratch_card_games(is_active) WHERE is_active = true;
