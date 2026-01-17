/*
  # Système de variations de produits

  ## Description
  Ce système permet de gérer des produits avec variations (couleurs, tailles, etc.)
  
  ## Nouvelles tables
  
  ### `product_variations`
  - Variations de produits avec prix, stock, images spécifiques
  
  ## Tables existantes modifiées
  
  ### `products`
  - Ajout de `has_variations` (boolean)
  - Ajout de `is_variable_product` (boolean)
  
  ## Sécurité
  - RLS activé
  - Lecture publique pour variations actives
  - Modification réservée aux admins
*/

-- Ajouter les colonnes aux produits
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'has_variations'
  ) THEN
    ALTER TABLE products ADD COLUMN has_variations boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_variable_product'
  ) THEN
    ALTER TABLE products ADD COLUMN is_variable_product boolean DEFAULT false;
  END IF;
END $$;

-- Créer la table des variations
CREATE TABLE IF NOT EXISTS product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku text,
  variation_type text NOT NULL DEFAULT 'simple',
  color_name text,
  color_hex text,
  size_name text,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  sale_price numeric(10, 2),
  stock_quantity integer DEFAULT 0,
  image_url text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_variation_type CHECK (variation_type IN ('simple', 'color', 'size', 'color_size'))
);

-- Index
CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variations_sku ON product_variations(sku);
CREATE INDEX IF NOT EXISTS idx_product_variations_active ON product_variations(is_active);

-- Activer RLS
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;

-- Politiques
DROP POLICY IF EXISTS "Public can view active variations" ON product_variations;
CREATE POLICY "Public can view active variations"
  ON product_variations
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can view all variations" ON product_variations;
CREATE POLICY "Admins can view all variations"
  ON product_variations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can insert variations" ON product_variations;
CREATE POLICY "Admins can insert variations"
  ON product_variations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update variations" ON product_variations;
CREATE POLICY "Admins can update variations"
  ON product_variations
  FOR UPDATE
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

DROP POLICY IF EXISTS "Admins can delete variations" ON product_variations;
CREATE POLICY "Admins can delete variations"
  ON product_variations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Trigger
CREATE OR REPLACE FUNCTION update_product_variations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_variations_updated_at ON product_variations;
CREATE TRIGGER update_product_variations_updated_at
  BEFORE UPDATE ON product_variations
  FOR EACH ROW
  EXECUTE FUNCTION update_product_variations_updated_at();
