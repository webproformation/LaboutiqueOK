/*
  # Système complet de Live Streaming

  1. Nouvelles Tables
    - `live_chat_messages` - Messages du chat en temps réel pendant les lives
      - `id` (uuid, primary key)
      - `live_stream_id` (text, foreign key)
      - `user_id` (uuid, foreign key)
      - `message` (text)
      - `is_pinned` (boolean)
      - `is_deleted` (boolean)
      - `created_at` (timestamptz)
    
    - `live_shared_products` - Produits partagés pendant le live
      - `id` (uuid, primary key)
      - `live_stream_id` (text, foreign key)
      - `product_id` (text, foreign key)
      - `shared_at` (timestamptz)
      - `is_featured` (boolean)
      - `special_offer` (text)
      - `clicks` (integer)
    
    - `live_viewers` - Suivi des spectateurs en temps réel
      - `id` (uuid, primary key)
      - `live_stream_id` (text, foreign key)
      - `user_id` (uuid, foreign key)
      - `joined_at` (timestamptz)
      - `left_at` (timestamptz)
      - `is_active` (boolean)
    
    - `obs_settings` - Paramètres OBS pour les lives
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `stream_key` (text)
      - `stream_server` (text)
      - `video_bitrate` (integer)
      - `audio_bitrate` (integer)
      - `resolution` (text)
      - `fps` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `live_recordings` - Enregistrements et replays des lives
      - `id` (uuid, primary key)
      - `live_stream_id` (text, foreign key)
      - `file_url` (text)
      - `file_size` (bigint)
      - `duration` (integer)
      - `format` (text)
      - `is_public` (boolean)
      - `views` (integer)
      - `created_at` (timestamptz)

  2. Ajouts à la table `live_streams`
    - `stream_key` (text) - Clé de stream unique
    - `chat_enabled` (boolean) - Chat activé ou non
    - `products_enabled` (boolean) - Partage de produits activé
    - `max_viewers` (integer) - Nombre max de spectateurs atteints
    - `average_watch_time` (integer) - Temps de visionnage moyen en secondes
    - `likes_count` (integer) - Nombre de likes
    - `is_recorded` (boolean) - Enregistré ou non

  3. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users and admins
*/

-- Ajouter colonnes manquantes à live_streams
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_streams' AND column_name = 'stream_key'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN stream_key text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_streams' AND column_name = 'chat_enabled'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN chat_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_streams' AND column_name = 'products_enabled'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN products_enabled boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_streams' AND column_name = 'max_viewers'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN max_viewers integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_streams' AND column_name = 'average_watch_time'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN average_watch_time integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_streams' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN likes_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_streams' AND column_name = 'is_recorded'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN is_recorded boolean DEFAULT false;
  END IF;
END $$;

-- Table live_chat_messages
CREATE TABLE IF NOT EXISTS live_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id text NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_pinned boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read chat messages"
  ON live_chat_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can send chat messages"
  ON live_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage chat messages"
  ON live_chat_messages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Table live_shared_products
CREATE TABLE IF NOT EXISTS live_shared_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id text NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  shared_at timestamptz DEFAULT now(),
  is_featured boolean DEFAULT false,
  special_offer text,
  clicks integer DEFAULT 0
);

ALTER TABLE live_shared_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view shared products"
  ON live_shared_products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage shared products"
  ON live_shared_products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Table live_viewers
CREATE TABLE IF NOT EXISTS live_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id text NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  is_active boolean DEFAULT true
);

ALTER TABLE live_viewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view live viewers"
  ON live_viewers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join as viewer"
  ON live_viewers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their viewer status"
  ON live_viewers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table obs_settings
CREATE TABLE IF NOT EXISTS obs_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stream_key text NOT NULL,
  stream_server text DEFAULT 'rtmp://live.laboutiquedemorgane.com/live',
  video_bitrate integer DEFAULT 2500,
  audio_bitrate integer DEFAULT 128,
  resolution text DEFAULT '1920x1080',
  fps integer DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE obs_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage OBS settings"
  ON obs_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Table live_recordings
CREATE TABLE IF NOT EXISTS live_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id text NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_size bigint DEFAULT 0,
  duration integer DEFAULT 0,
  format text DEFAULT 'mp4',
  is_public boolean DEFAULT false,
  views integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE live_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view public recordings"
  ON live_recordings FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Admins can manage recordings"
  ON live_recordings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_live_stream ON live_chat_messages(live_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_chat_messages_created ON live_chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_shared_products_live_stream ON live_shared_products(live_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_viewers_live_stream ON live_viewers(live_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_viewers_active ON live_viewers(is_active);
CREATE INDEX IF NOT EXISTS idx_live_recordings_live_stream ON live_recordings(live_stream_id);
