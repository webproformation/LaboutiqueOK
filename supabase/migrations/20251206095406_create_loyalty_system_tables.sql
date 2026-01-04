/*
  # Create Loyalty System Tables

  1. New Tables
    - `loyalty_points`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `page_visit_points` (integer) - Points from page visits
      - `live_participation_count` (integer) - Number of lives attended
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `page_visits`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `page_path` (text) - URL path visited
      - `visited_at` (timestamp)
    
    - `live_participations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `live_id` (text) - Identifier for the live session
      - `participated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data

  3. Important Notes
    - Page visit points: 1 visit = 1 point, 500 points = 1% discount (max 3% = 1500 points)
    - Live participation: 1 live = 1% discount (max 5% = 5 lives)
    - Total max discount: 8% (3% from visits + 5% from lives)
*/

-- Create loyalty_points table
CREATE TABLE IF NOT EXISTS loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  page_visit_points integer DEFAULT 0 NOT NULL,
  live_participation_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create page_visits table
CREATE TABLE IF NOT EXISTS page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  page_path text NOT NULL,
  visited_at timestamptz DEFAULT now() NOT NULL
);

-- Create live_participations table
CREATE TABLE IF NOT EXISTS live_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  live_id text NOT NULL,
  participated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, live_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_user_id ON page_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_visited_at ON page_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_live_participations_user_id ON live_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_live_participations_live_id ON live_participations(live_id);

-- Enable Row Level Security
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_participations ENABLE ROW LEVEL SECURITY;

-- Policies for loyalty_points
CREATE POLICY "Users can view own loyalty points"
  ON loyalty_points FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loyalty points"
  ON loyalty_points FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own loyalty points"
  ON loyalty_points FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policies for page_visits
CREATE POLICY "Users can view own page visits"
  ON page_visits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own page visits"
  ON page_visits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies for live_participations
CREATE POLICY "Users can view own live participations"
  ON live_participations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own live participations"
  ON live_participations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update loyalty_points updated_at timestamp
CREATE OR REPLACE FUNCTION update_loyalty_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS loyalty_points_updated_at ON loyalty_points;
CREATE TRIGGER loyalty_points_updated_at
  BEFORE UPDATE ON loyalty_points
  FOR EACH ROW
  EXECUTE FUNCTION update_loyalty_points_updated_at();
