/*
  # Création de la table package_items

  1. Nouvelle table `package_items`
    - `id` (uuid, primary key)
    - `package_id` (text, foreign key vers open_packages)
    - `product_id` (text, ID du produit)
    - `product_name` (text, nom du produit)
    - `quantity` (integer, quantité)
    - `price` (numeric, prix unitaire)
    - `image_url` (text, URL de l'image)
    - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Policies pour les utilisateurs authentifiés
*/

CREATE TABLE IF NOT EXISTS package_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id text NOT NULL REFERENCES open_packages(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL DEFAULT 0,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE package_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own package items"
  ON package_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM open_packages
      WHERE open_packages.id = package_items.package_id
      AND open_packages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own package items"
  ON package_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM open_packages
      WHERE open_packages.id = package_items.package_id
      AND open_packages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own package items"
  ON package_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM open_packages
      WHERE open_packages.id = package_items.package_id
      AND open_packages.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM open_packages
      WHERE open_packages.id = package_items.package_id
      AND open_packages.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own package items"
  ON package_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM open_packages
      WHERE open_packages.id = package_items.package_id
      AND open_packages.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_package_items_package_id ON package_items(package_id);
