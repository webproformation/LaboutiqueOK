/*
  # Système Dashboard Stats + Avoirs (Store Credits) v2

  1. Nouvelles Tables
    - `dashboard_stats` : Compteurs configurables pour la page d'accueil
    - `store_credits` : Système d'avoirs clients

  2. Sécurité
    - RLS activé sur toutes les tables
    - Policies appropriées
*/

-- Table des statistiques du dashboard
CREATE TABLE IF NOT EXISTS dashboard_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diamonds_found integer DEFAULT 0,
  reviews_validated integer DEFAULT 0,
  packages_sent integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Insérer une ligne initiale
INSERT INTO dashboard_stats (diamonds_found, reviews_validated, packages_sent)
SELECT 0, 0, 0
WHERE NOT EXISTS (SELECT 1 FROM dashboard_stats LIMIT 1);

ALTER TABLE dashboard_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view dashboard stats" ON dashboard_stats;
CREATE POLICY "Anyone can view dashboard stats"
  ON dashboard_stats FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admins can update dashboard stats" ON dashboard_stats;
CREATE POLICY "Only admins can update dashboard stats"
  ON dashboard_stats FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Table des avoirs (store credits)
CREATE TABLE IF NOT EXISTS store_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  reason text,
  status text DEFAULT 'available' CHECK (status IN ('available', 'used', 'expired')),
  expires_at timestamptz,
  created_by uuid REFERENCES profiles(id),
  used_at timestamptz,
  order_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_credits_user_id ON store_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_store_credits_status ON store_credits(status);

ALTER TABLE store_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own store credits" ON store_credits;
CREATE POLICY "Users can view their own store credits"
  ON store_credits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all store credits" ON store_credits;
CREATE POLICY "Admins can view all store credits"
  ON store_credits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can insert store credits" ON store_credits;
CREATE POLICY "Admins can insert store credits"
  ON store_credits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update store credits" ON store_credits;
CREATE POLICY "Admins can update store credits"
  ON store_credits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can delete store credits" ON store_credits;
CREATE POLICY "Admins can delete store credits"
  ON store_credits FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Ajouter une colonne used_referral_code à profiles si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'used_referral_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN used_referral_code text;
  END IF;
END $$;
