/*
  # Créer la table des produits mis en vedette

  1. Nouvelle table
    - `featured_products`
      - `product_id` (text, référence vers products)
      - `display_order` (integer) - ordre d'affichage
      - `is_active` (boolean) - actif ou non
      - `created_at` (timestamp)
  
  2. Sécurité
    - Enable RLS sur `featured_products`
    - Politique de lecture publique
    - Politique d'écriture pour admins seulement
*/

CREATE TABLE IF NOT EXISTS featured_products (
  product_id text PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE featured_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active featured products"
  ON featured_products
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can manage featured products"
  ON featured_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_featured_products_order ON featured_products(display_order);
CREATE INDEX IF NOT EXISTS idx_featured_products_active ON featured_products(is_active);
