/*
  # Création du système de Lives & Replay

  1. Nouvelles Tables
    - `live_stream_settings` : Configuration des providers de streaming
    - `live_streams` : Gestion des streams (scheduled/live/ended)
    - `live_stream_products` : Produits affichés pendant les lives
    - `live_stream_viewers` : Tracking des spectateurs
    - `live_stream_chat_messages` : Messages du chat en direct
    - `live_stream_analytics` : Analytics détaillées par session
  
  2. Sécurité
    - RLS activé sur toutes les tables
    - Settings: Admin uniquement
    - Streams: Admin pour écriture, public pour lecture
    - Chat: Authentifié pour écriture, public pour lecture
    - Analytics: Tracking automatique
  
  3. Notes Importantes
    - featured_product_id est TEXT pour compatibilité WooCommerce
    - Support multi-providers: Mux, AWS IVS, Restream, nginx-rtmp, Custom
    - Chat temps réel via Supabase Realtime
    - Analytics avec durée de visionnage et interactions
*/

-- Table des paramètres de streaming
CREATE TABLE IF NOT EXISTS live_stream_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  streaming_provider text NOT NULL DEFAULT 'mux',
  mux_api_key text,
  mux_secret_key text,
  aws_ivs_channel_arn text,
  aws_ivs_playback_url text,
  restream_stream_key text,
  nginx_rtmp_url text,
  nginx_rtmp_app_name text DEFAULT 'live',
  custom_stream_url text,
  custom_playback_url text,
  enable_chat boolean DEFAULT true,
  enable_product_overlay boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE live_stream_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage stream settings"
  ON live_stream_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Table des streams
CREATE TABLE IF NOT EXISTS live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  scheduled_start timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  stream_key text,
  playback_url text,
  provider_stream_id text,
  current_viewers integer DEFAULT 0,
  peak_viewers integer DEFAULT 0,
  total_views integer DEFAULT 0,
  featured_product_id text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_scheduled_start ON live_streams(scheduled_start);

ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live streams"
  ON live_streams
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage live streams"
  ON live_streams
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Table des produits dans les streams
CREATE TABLE IF NOT EXISTS live_stream_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id uuid NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_image text,
  product_price text,
  product_url text,
  displayed_at timestamptz DEFAULT now(),
  removed_at timestamptz,
  click_count integer DEFAULT 0,
  order_count integer DEFAULT 0,
  revenue decimal(10,2) DEFAULT 0,
  position integer DEFAULT 0,
  is_current boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_stream_products_stream_id ON live_stream_products(live_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_products_is_current ON live_stream_products(is_current) WHERE is_current = true;

ALTER TABLE live_stream_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stream products"
  ON live_stream_products
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can manage stream products"
  ON live_stream_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Table des spectateurs
CREATE TABLE IF NOT EXISTS live_stream_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id uuid NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  session_id text NOT NULL,
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  watch_duration integer DEFAULT 0,
  clicked_products jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_stream_viewers_stream_id ON live_stream_viewers(live_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_viewers_session_id ON live_stream_viewers(session_id);

ALTER TABLE live_stream_viewers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own viewer session"
  ON live_stream_viewers
  FOR ALL
  TO anon, authenticated
  USING (session_id = current_setting('request.headers')::json->>'x-session-id' OR auth.uid() = user_id);

-- Table des messages de chat
CREATE TABLE IF NOT EXISTS live_stream_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id uuid NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  username text NOT NULL,
  avatar_url text,
  message text NOT NULL,
  is_pinned boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_stream_chat_stream_id ON live_stream_chat_messages(live_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_chat_created_at ON live_stream_chat_messages(created_at DESC);

ALTER TABLE live_stream_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chat messages"
  ON live_stream_chat_messages
  FOR SELECT
  TO anon, authenticated
  USING (is_deleted = false);

CREATE POLICY "Authenticated users can send messages"
  ON live_stream_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage all messages"
  ON live_stream_chat_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Table des analytics
CREATE TABLE IF NOT EXISTS live_stream_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  session_id text NOT NULL,
  joined_at timestamptz NOT NULL,
  left_at timestamptz,
  time_watched_seconds integer DEFAULT 0,
  messages_sent integer DEFAULT 0,
  products_clicked integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_stream_analytics_stream_id ON live_stream_analytics(stream_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_analytics_session_id ON live_stream_analytics(session_id);

ALTER TABLE live_stream_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own analytics"
  ON live_stream_analytics
  FOR ALL
  TO anon, authenticated
  USING (session_id = current_setting('request.headers')::json->>'x-session-id' OR auth.uid() = user_id);

CREATE POLICY "Admin can view all analytics"
  ON live_stream_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );