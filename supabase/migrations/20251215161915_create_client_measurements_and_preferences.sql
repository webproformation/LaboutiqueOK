/*
  # Système de mensurations et préférences client

  1. Nouvelles tables
    - `client_measurements` : Stockage des mensurations des clients
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key vers auth.users)
      - `height` (integer, taille en cm)
      - `weight` (integer, poids en kg)
      - `bust` (integer, tour de poitrine en cm)
      - `waist` (integer, tour de taille en cm)
      - `hips` (integer, tour de hanches en cm)
      - `shoe_size` (numeric, pointure)
      - `preferred_size` (text, taille préférée S/M/L/XL)
      - `body_type` (text, morphologie)
      - `style_preferences` (jsonb, préférences de style)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur `client_measurements`
    - Policies pour que les clients puissent gérer leurs propres mensurations
    - Policies admin pour consultation
*/

-- Create client_measurements table
CREATE TABLE IF NOT EXISTS client_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  height integer,
  weight integer,
  bust integer,
  waist integer,
  hips integer,
  shoe_size numeric(3,1),
  preferred_size text,
  body_type text,
  style_preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE client_measurements ENABLE ROW LEVEL SECURITY;

-- Policies for client_measurements
CREATE POLICY "Users can view own measurements"
  ON client_measurements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements"
  ON client_measurements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements"
  ON client_measurements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements"
  ON client_measurements
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all measurements"
  ON client_measurements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_client_measurements_user_id ON client_measurements(user_id);

-- Create function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_measurements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_client_measurements_updated_at ON client_measurements;
CREATE TRIGGER update_client_measurements_updated_at
  BEFORE UPDATE ON client_measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_measurements_updated_at();