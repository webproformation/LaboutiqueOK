/*
  # Système Colis Ouvert

  1. Nouvelles Tables
    - `open_packages` - Colis ouverts des clients
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `status` (text) - 'active', 'closed', 'shipped'
      - `shipping_cost_paid` (numeric) - Frais de livraison payés
      - `shipping_method_id` (uuid) - Méthode de livraison
      - `shipping_address_id` (uuid) - Adresse de livraison
      - `opened_at` (timestamptz) - Date d'ouverture
      - `closes_at` (timestamptz) - Date de fermeture (5 jours)
      - `shipped_at` (timestamptz) - Date d'expédition
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `open_package_orders` - Commandes dans le colis ouvert
      - `id` (uuid, primary key)
      - `open_package_id` (uuid, foreign key to open_packages)
      - `order_id` (uuid, foreign key to orders)
      - `added_at` (timestamptz)
      - `paid_at` (timestamptz)
      - `is_paid` (boolean)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Users peuvent voir/gérer leurs propres colis
    - Admins peuvent tout voir
*/

-- Table open_packages
CREATE TABLE IF NOT EXISTS open_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'closed', 'shipped')),
  shipping_cost_paid numeric DEFAULT 0 NOT NULL,
  shipping_method_id uuid,
  shipping_address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
  opened_at timestamptz DEFAULT now() NOT NULL,
  closes_at timestamptz DEFAULT (now() + interval '5 days') NOT NULL,
  shipped_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_open_packages_user_id ON open_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_open_packages_status ON open_packages(status);
CREATE INDEX IF NOT EXISTS idx_open_packages_closes_at ON open_packages(closes_at);

ALTER TABLE open_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own open packages"
  ON open_packages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own open packages"
  ON open_packages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own open packages"
  ON open_packages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all open packages"
  ON open_packages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Table open_package_orders
CREATE TABLE IF NOT EXISTS open_package_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  open_package_id uuid NOT NULL REFERENCES open_packages(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now() NOT NULL,
  paid_at timestamptz,
  is_paid boolean DEFAULT false NOT NULL,
  UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_open_package_orders_package_id ON open_package_orders(open_package_id);
CREATE INDEX IF NOT EXISTS idx_open_package_orders_order_id ON open_package_orders(order_id);

ALTER TABLE open_package_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own package orders"
  ON open_package_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM open_packages
      WHERE open_packages.id = open_package_orders.open_package_id
      AND open_packages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own package orders"
  ON open_package_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM open_packages
      WHERE open_packages.id = open_package_orders.open_package_id
      AND open_packages.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all package orders"
  ON open_package_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_open_packages_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_open_packages_timestamp
  BEFORE UPDATE ON open_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_open_packages_updated_at();
