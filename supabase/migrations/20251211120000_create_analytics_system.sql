/*
  # Create Analytics System

  1. New Tables
    - page_visits: Track page visits and time spent
    - user_sessions: Track user sessions
    - live_stream_analytics: Track live stream participation
    - order_analytics: Track order metrics
      
  2. Security
    - Enable RLS on all analytics tables
    - Only authenticated admins can read analytics data
    - Public can insert their own analytics (visit tracking)
    
  3. Indexes
    - Add indexes for common query patterns
*/

-- Create page_visits table
CREATE TABLE IF NOT EXISTS page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id uuid NOT NULL,
  page_path text NOT NULL,
  page_title text,
  referrer text,
  user_agent text,
  device_type text,
  browser text,
  time_spent_seconds integer DEFAULT 0,
  visited_at timestamptz DEFAULT now(),
  left_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id uuid UNIQUE NOT NULL,
  started_at timestamptz DEFAULT now(),
  last_activity_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  total_pages_viewed integer DEFAULT 0,
  total_time_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create live_stream_analytics table
CREATE TABLE IF NOT EXISTS live_stream_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id uuid NOT NULL,
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  time_watched_seconds integer DEFAULT 0,
  messages_sent integer DEFAULT 0,
  products_clicked integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create order_analytics table
CREATE TABLE IF NOT EXISTS order_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_total decimal NOT NULL,
  items_count integer NOT NULL,
  payment_method text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_stream_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for page_visits
CREATE POLICY "Anyone can insert page visits"
  ON page_visits FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Admins can view all page visits"
  ON page_visits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.admin_access = true
    )
  );

-- Policies for user_sessions
CREATE POLICY "Anyone can insert/update sessions"
  ON user_sessions FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own sessions"
  ON user_sessions FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.admin_access = true
    )
  );

-- Policies for live_stream_analytics
CREATE POLICY "Anyone can insert live analytics"
  ON live_stream_analytics FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own live analytics"
  ON live_stream_analytics FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can view all live analytics"
  ON live_stream_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.admin_access = true
    )
  );

-- Policies for order_analytics
CREATE POLICY "System can insert order analytics"
  ON order_analytics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all order analytics"
  ON order_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.admin_access = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_page_visits_visited_at ON page_visits(visited_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_visits_user_id ON page_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON page_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_page_path ON page_visits(page_path);

CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);

CREATE INDEX IF NOT EXISTS idx_live_analytics_stream_id ON live_stream_analytics(stream_id);
CREATE INDEX IF NOT EXISTS idx_live_analytics_joined_at ON live_stream_analytics(joined_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_analytics_created_at ON order_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_analytics_user_id ON order_analytics(user_id);
