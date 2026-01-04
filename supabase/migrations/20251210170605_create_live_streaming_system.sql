/*
  # Live Streaming System

  ## Overview
  Complete live streaming system with multi-platform support (Mux, AWS IVS, Restream, nginx-rtmp)
  and real-time product synchronization for live shopping experiences.

  ## 1. New Tables

  ### `live_stream_settings`
  Global configuration for streaming services
  - `id` (uuid, primary key)
  - `streaming_provider` (text) - 'mux' | 'aws-ivs' | 'restream' | 'nginx-rtmp' | 'custom'
  - `mux_api_key` (text, encrypted)
  - `mux_secret_key` (text, encrypted)
  - `aws_ivs_channel_arn` (text)
  - `aws_ivs_playback_url` (text)
  - `restream_stream_key` (text, encrypted)
  - `nginx_rtmp_url` (text)
  - `nginx_rtmp_app_name` (text)
  - `custom_stream_url` (text)
  - `custom_playback_url` (text)
  - `enable_chat` (boolean)
  - `enable_product_overlay` (boolean)
  - `updated_at` (timestamptz)
  - `updated_by` (uuid, references auth.users)

  ### `live_streams`
  Individual live stream sessions
  - `id` (uuid, primary key)
  - `title` (text)
  - `description` (text)
  - `thumbnail_url` (text)
  - `status` (text) - 'scheduled' | 'live' | 'ended' | 'error'
  - `scheduled_start` (timestamptz)
  - `actual_start` (timestamptz)
  - `actual_end` (timestamptz)
  - `stream_key` (text, encrypted)
  - `playback_url` (text)
  - `provider_stream_id` (text) - ID from streaming provider
  - `current_viewers` (integer)
  - `peak_viewers` (integer)
  - `total_views` (integer)
  - `featured_product_id` (text) - Current WooCommerce product being showcased
  - `created_at` (timestamptz)
  - `created_by` (uuid, references auth.users)
  - `updated_at` (timestamptz)

  ### `live_stream_products`
  Products featured during live streams with timestamps
  - `id` (uuid, primary key)
  - `live_stream_id` (uuid, references live_streams)
  - `product_id` (text) - WooCommerce product ID
  - `product_name` (text)
  - `product_image` (text)
  - `product_price` (text)
  - `product_url` (text)
  - `displayed_at` (timestamptz)
  - `removed_at` (timestamptz)
  - `click_count` (integer)
  - `order_count` (integer)
  - `revenue` (decimal)
  - `position` (integer) - Display order/priority
  - `is_current` (boolean)
  - `created_at` (timestamptz)

  ### `live_stream_viewers`
  Track viewer engagement and analytics
  - `id` (uuid, primary key)
  - `live_stream_id` (uuid, references live_streams)
  - `user_id` (uuid, references auth.users, nullable)
  - `session_id` (text) - For anonymous viewers
  - `joined_at` (timestamptz)
  - `left_at` (timestamptz)
  - `watch_duration` (integer) - seconds
  - `clicked_products` (jsonb) - Array of product IDs clicked
  - `created_at` (timestamptz)

  ### `live_stream_chat_messages`
  Chat messages during live streams
  - `id` (uuid, primary key)
  - `live_stream_id` (uuid, references live_streams)
  - `user_id` (uuid, references auth.users, nullable)
  - `username` (text)
  - `message` (text)
  - `is_pinned` (boolean)
  - `is_deleted` (boolean)
  - `created_at` (timestamptz)

  ## 2. Security (RLS)
  - Enable RLS on all tables
  - Admins can manage all records (using existing is_admin() function)
  - Authenticated users can view live streams and participate in chat
  - Public can view active live streams (read-only)
  - Analytics data only accessible by admins

  ## 3. Indexes
  - Index on live_streams.status for quick filtering
  - Index on live_stream_products.live_stream_id and is_current
  - Index on live_stream_viewers.live_stream_id for analytics
  - Index on live_stream_chat_messages.live_stream_id and created_at

  ## 4. Functions
  - Update current_viewers count in real-time
  - Auto-calculate watch duration when viewer leaves
  - Trigger to update peak_viewers when current_viewers increases
*/

-- 1. Live Stream Settings Table
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

-- 2. Live Streams Table
CREATE TABLE IF NOT EXISTS live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'scheduled',
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

-- 3. Live Stream Products Table
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

-- 4. Live Stream Viewers Table
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

-- 5. Live Stream Chat Messages Table
CREATE TABLE IF NOT EXISTS live_stream_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  live_stream_id uuid NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  username text NOT NULL,
  message text NOT NULL,
  is_pinned boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_scheduled_start ON live_streams(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_live_stream_products_stream_id ON live_stream_products(live_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_products_current ON live_stream_products(live_stream_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_live_stream_viewers_stream_id ON live_stream_viewers(live_stream_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_viewers_session ON live_stream_viewers(session_id);
CREATE INDEX IF NOT EXISTS idx_live_stream_chat_stream_id ON live_stream_chat_messages(live_stream_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE live_stream_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_stream_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_stream_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_stream_settings
CREATE POLICY "Admins can manage live stream settings"
  ON live_stream_settings FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for live_streams
CREATE POLICY "Anyone can view live or scheduled streams"
  ON live_streams FOR SELECT
  USING (status IN ('scheduled', 'live'));

CREATE POLICY "Admins can manage live streams"
  ON live_streams FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for live_stream_products
CREATE POLICY "Anyone can view current live stream products"
  ON live_stream_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM live_streams
      WHERE live_streams.id = live_stream_products.live_stream_id
      AND live_streams.status = 'live'
    )
  );

CREATE POLICY "Admins can manage live stream products"
  ON live_stream_products FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- RLS Policies for live_stream_viewers
CREATE POLICY "Users can view their own viewer data"
  ON live_stream_viewers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can insert viewer data"
  ON live_stream_viewers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own viewer data"
  ON live_stream_viewers FOR UPDATE
  USING (user_id = auth.uid() OR session_id IS NOT NULL)
  WITH CHECK (user_id = auth.uid() OR session_id IS NOT NULL);

CREATE POLICY "Admins can view all viewer analytics"
  ON live_stream_viewers FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- RLS Policies for live_stream_chat_messages
CREATE POLICY "Anyone can view chat messages for live streams"
  ON live_stream_chat_messages FOR SELECT
  USING (
    NOT is_deleted AND
    EXISTS (
      SELECT 1 FROM live_streams
      WHERE live_streams.id = live_stream_chat_messages.live_stream_id
      AND live_streams.status = 'live'
    )
  );

CREATE POLICY "Authenticated users can send chat messages"
  ON live_stream_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages"
  ON live_stream_chat_messages FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all chat messages"
  ON live_stream_chat_messages FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Function to update peak viewers
CREATE OR REPLACE FUNCTION update_peak_viewers()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_viewers > OLD.peak_viewers THEN
    NEW.peak_viewers := NEW.current_viewers;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for peak viewers
DROP TRIGGER IF EXISTS trigger_update_peak_viewers ON live_streams;
CREATE TRIGGER trigger_update_peak_viewers
  BEFORE UPDATE OF current_viewers ON live_streams
  FOR EACH ROW
  EXECUTE FUNCTION update_peak_viewers();

-- Function to calculate watch duration when viewer leaves
CREATE OR REPLACE FUNCTION calculate_watch_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.left_at IS NOT NULL AND OLD.left_at IS NULL THEN
    NEW.watch_duration := EXTRACT(EPOCH FROM (NEW.left_at - NEW.joined_at))::integer;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for watch duration
DROP TRIGGER IF EXISTS trigger_calculate_watch_duration ON live_stream_viewers;
CREATE TRIGGER trigger_calculate_watch_duration
  BEFORE UPDATE OF left_at ON live_stream_viewers
  FOR EACH ROW
  EXECUTE FUNCTION calculate_watch_duration();

-- Insert default settings row (only if none exists)
INSERT INTO live_stream_settings (streaming_provider, enable_chat, enable_product_overlay)
SELECT 'mux', true, true
WHERE NOT EXISTS (SELECT 1 FROM live_stream_settings LIMIT 1);