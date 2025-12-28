/*
  # Create Scratch Game Settings Table

  1. New Tables
    - `scratch_game_settings`
      - `id` (uuid, primary key) - Unique identifier
      - `is_enabled` (boolean) - Whether the game popup is active
      - `popup_delay_seconds` (integer) - Delay before showing popup in seconds
      - `win_probability` (integer) - Percentage chance of winning (0-100)
      - `max_plays_per_user` (integer) - Maximum plays per user (0 = unlimited)
      - `updated_at` (timestamp) - Last update timestamp
      - `updated_by` (uuid) - User who last updated settings
  
  2. Security
    - Enable RLS on the table
    - Anyone can read settings (needed for popup display)
    - Only admins can update settings
  
  3. Important Notes
    - Only one row should exist in this table (singleton pattern)
    - Default settings: enabled=false, delay=30s, win_probability=30%, max_plays=1
*/

CREATE TABLE IF NOT EXISTS scratch_game_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean DEFAULT false NOT NULL,
  popup_delay_seconds integer DEFAULT 30 NOT NULL,
  win_probability integer DEFAULT 30 NOT NULL CHECK (win_probability >= 0 AND win_probability <= 100),
  max_plays_per_user integer DEFAULT 1 NOT NULL CHECK (max_plays_per_user >= 0),
  updated_at timestamptz DEFAULT now() NOT NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_scratch_game_settings_is_enabled ON scratch_game_settings(is_enabled);

ALTER TABLE scratch_game_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view scratch game settings"
  ON scratch_game_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can update scratch game settings"
  ON scratch_game_settings FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can insert scratch game settings"
  ON scratch_game_settings FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

INSERT INTO scratch_game_settings (is_enabled, popup_delay_seconds, win_probability, max_plays_per_user)
VALUES (false, 30, 30, 1)
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION update_scratch_game_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scratch_game_settings_updated_at ON scratch_game_settings;
CREATE TRIGGER scratch_game_settings_updated_at
  BEFORE UPDATE ON scratch_game_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_scratch_game_settings_updated_at();