/*
  # Ajouter table des mensurations clients

  1. Nouvelle table
    - `customer_measurements`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence vers auth.users)
      - `height` (integer, taille en cm)
      - `weight` (numeric, poids en kg)
      - `bust` (integer, tour de poitrine en cm)
      - `waist` (integer, tour de taille en cm)
      - `hips` (integer, tour de hanches en cm)
      - `inseam` (integer, entrejambe en cm)
      - `shoe_size` (text, pointure)
      - `notes` (text, notes personnelles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS
    - Les utilisateurs peuvent voir et modifier uniquement leurs propres mensurations
    - Les admins peuvent voir toutes les mensurations
*/

CREATE TABLE IF NOT EXISTS customer_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  height integer,
  weight numeric(5,2),
  bust integer,
  waist integer,
  hips integer,
  inseam integer,
  shoe_size text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE customer_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own measurements"
  ON customer_measurements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own measurements"
  ON customer_measurements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements"
  ON customer_measurements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements"
  ON customer_measurements
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all measurements"
  ON customer_measurements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'update_customer_measurements_updated_at'
  ) THEN
    CREATE FUNCTION update_customer_measurements_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_customer_measurements_updated_at ON customer_measurements;

CREATE TRIGGER update_customer_measurements_updated_at
  BEFORE UPDATE ON customer_measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_measurements_updated_at();
