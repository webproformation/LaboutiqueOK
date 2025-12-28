/*
  # Create Wheel Game System

  ## Overview
  Creates a lottery wheel game system with configurable winning and losing zones.

  ## New Tables
  
  ### `wheel_game_settings`
  Stores the configuration for the wheel game including zones and game rules.
  - `id` (uuid, primary key)
  - `is_enabled` (boolean) - Whether the game is active
  - `require_newsletter` (boolean) - Must subscribe to newsletter to play
  - `require_authentication` (boolean) - Must be logged in to play
  - `max_plays_per_day` (integer) - Maximum plays per user per day (0 = unlimited)
  - `winning_zones` (jsonb) - Array of winning zones with coupon_type_id and probability
  - `losing_zones` (jsonb) - Array of losing zones with message and probability
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `wheel_game_plays`
  Tracks all wheel game plays for rate limiting and analytics.
  - `id` (uuid, primary key)
  - `user_id` (uuid, nullable) - Reference to auth.users
  - `session_id` (text) - For anonymous users
  - `won` (boolean) - Whether the user won
  - `prize_type` (text) - 'coupon' or 'none'
  - `coupon_type_id` (uuid, nullable) - Reference to coupon_types table
  - `user_coupon_id` (uuid, nullable) - Reference to user_coupons table if won
  - `zone_index` (integer) - Which zone was landed on
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Admins can manage wheel game settings
  - Users can view active game settings
  - Users can record their plays
  - Users can view their own play history

  ## Notes
  - Only one game should be enabled at a time (scratch or wheel)
  - Winning zones reference existing coupon types from the coupon_types table
  - Probabilities should sum to 100 for fair distribution
*/

-- Create wheel_game_settings table
CREATE TABLE IF NOT EXISTS wheel_game_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean DEFAULT false,
  require_newsletter boolean DEFAULT true,
  require_authentication boolean DEFAULT false,
  max_plays_per_day integer DEFAULT 1,
  winning_zones jsonb DEFAULT '[]'::jsonb,
  losing_zones jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create wheel_game_plays table
CREATE TABLE IF NOT EXISTS wheel_game_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  won boolean DEFAULT false,
  prize_type text DEFAULT 'none',
  coupon_type_id uuid REFERENCES coupon_types(id) ON DELETE SET NULL,
  user_coupon_id uuid REFERENCES user_coupons(id) ON DELETE SET NULL,
  zone_index integer,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wheel_plays_user_id ON wheel_game_plays(user_id);
CREATE INDEX IF NOT EXISTS idx_wheel_plays_session_id ON wheel_game_plays(session_id);
CREATE INDEX IF NOT EXISTS idx_wheel_plays_created_at ON wheel_game_plays(created_at);

-- Enable RLS
ALTER TABLE wheel_game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_game_plays ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wheel_game_settings

-- Public can view enabled game settings
CREATE POLICY "Anyone can view enabled wheel game settings"
  ON wheel_game_settings
  FOR SELECT
  USING (is_enabled = true);

-- Admins can view all settings
CREATE POLICY "Admins can view all wheel game settings"
  ON wheel_game_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins can insert settings
CREATE POLICY "Admins can insert wheel game settings"
  ON wheel_game_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins can update settings
CREATE POLICY "Admins can update wheel game settings"
  ON wheel_game_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins can delete settings
CREATE POLICY "Admins can delete wheel game settings"
  ON wheel_game_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for wheel_game_plays

-- Users can view their own plays
CREATE POLICY "Users can view own wheel game plays"
  ON wheel_game_plays
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Anonymous users can view their session plays
CREATE POLICY "Anonymous users can view session wheel plays"
  ON wheel_game_plays
  FOR SELECT
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN true
      ELSE user_id = auth.uid()
    END
  );

-- Anyone can insert plays (authenticated or anonymous)
CREATE POLICY "Anyone can insert wheel game plays"
  ON wheel_game_plays
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all plays
CREATE POLICY "Admins can view all wheel game plays"
  ON wheel_game_plays
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Insert default wheel game settings
INSERT INTO wheel_game_settings (
  is_enabled,
  require_newsletter,
  require_authentication,
  max_plays_per_day,
  winning_zones,
  losing_zones
)
SELECT
  false,
  true,
  false,
  1,
  '[]'::jsonb,
  '[
    {"message": "Dommage ! Retentez votre chance demain", "probability": 20},
    {"message": "Pas cette fois ! Revenez demain", "probability": 20},
    {"message": "Presque ! Réessayez demain", "probability": 10}
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM wheel_game_settings LIMIT 1);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_wheel_game_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS wheel_game_settings_updated_at ON wheel_game_settings;
CREATE TRIGGER wheel_game_settings_updated_at
  BEFORE UPDATE ON wheel_game_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_wheel_game_settings_updated_at();