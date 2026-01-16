/*
  # Ajout des fonctionnalités de gamification pour les lives

  1. Ajouts à la table `live_streams`
    - `viewer_goal` (integer) - Objectif de viewers pour débloquer le coffre
    - `ticker_text` (text) - Texte du bandeau défilant
    - `chest_unlocked` (boolean) - Coffre débloqué ou non
    - `chest_unlocked_at` (timestamptz) - Date de déverrouillage du coffre
    - `winner_user_id` (uuid) - ID du gagnant du tirage au sort
    - `winner_announced_at` (timestamptz) - Date d'annonce du gagnant

  2. Nouvelle table `live_emotions`
    - Suivi des émotions envoyées pendant le live (coeurs, feu, étoiles)

  3. Nouvelle table `live_timestamps`
    - Chapitrage des replays avec timestamps et produits associés

  4. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users
*/

-- Ajouter colonnes de gamification à live_streams
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_streams' AND column_name = 'viewer_goal'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN viewer_goal integer DEFAULT 100;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_streams' AND column_name = 'ticker_text'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN ticker_text text DEFAULT 'Bienvenue dans le live de Morgane ! 💎';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_streams' AND column_name = 'chest_unlocked'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN chest_unlocked boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_streams' AND column_name = 'chest_unlocked_at'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN chest_unlocked_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_streams' AND column_name = 'winner_user_id'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN winner_user_id uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_streams' AND column_name = 'winner_announced_at'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN winner_announced_at timestamptz;
  END IF;
END $$;

-- Table live_emotions
CREATE TABLE IF NOT EXISTS live_emotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id text NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  emotion_type text NOT NULL CHECK (emotion_type IN ('heart', 'fire', 'star')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE live_emotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view emotions"
  ON live_emotions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can send emotions"
  ON live_emotions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Table live_timestamps (chapitrage pour replays)
CREATE TABLE IF NOT EXISTS live_timestamps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id text NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  product_id text REFERENCES products(id) ON DELETE CASCADE,
  timestamp integer NOT NULL,
  title text NOT NULL,
  thumbnail_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE live_timestamps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view timestamps"
  ON live_timestamps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage timestamps"
  ON live_timestamps FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_live_emotions_live_stream ON live_emotions(live_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_emotions_created ON live_emotions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_timestamps_live_stream ON live_timestamps(live_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_timestamps_timestamp ON live_timestamps(timestamp);
