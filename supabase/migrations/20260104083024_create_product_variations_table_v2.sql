/*
  # Création de la table product_variations

  1. Nouvelle Table
    - `product_variations`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key vers products)
      - `attribute_term_id` (uuid, foreign key vers product_attribute_terms)
      - `image_url` (text, URL de l'image spécifique)
      - `price` (numeric, prix spécifique)
      - `sale_price` (numeric, prix promo spécifique)
      - `is_main_image` (boolean, si c'est l'image principale)
      - `stock_quantity` (integer, stock spécifique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Sécurité
    - Enable RLS
    - Policies pour lecture publique
    - Policies pour modification admin uniquement via user_roles
  
  3. Indexes
    - Index sur product_id pour les requêtes rapides
    - Index sur attribute_term_id
    - Contrainte unique sur (product_id, attribute_term_id)
*/

-- Créer la table product_variations
CREATE TABLE IF NOT EXISTS product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_term_id uuid NOT NULL REFERENCES product_attribute_terms(id) ON DELETE CASCADE,
  image_url text DEFAULT '',
  price numeric(10, 2) DEFAULT 0,
  sale_price numeric(10, 2) DEFAULT NULL,
  is_main_image boolean DEFAULT false,
  stock_quantity integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_product_variation UNIQUE (product_id, attribute_term_id)
);

-- Créer les index pour performance
CREATE INDEX IF NOT EXISTS idx_product_variations_product_id ON product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variations_attribute_term_id ON product_variations(attribute_term_id);

-- Enable RLS
ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire
CREATE POLICY "Anyone can read product variations"
  ON product_variations FOR SELECT
  TO public
  USING (true);

-- Policy: Seuls les admins peuvent insérer
CREATE POLICY "Admins can insert product variations"
  ON product_variations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policy: Seuls les admins peuvent modifier
CREATE POLICY "Admins can update product variations"
  ON product_variations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policy: Seuls les admins peuvent supprimer
CREATE POLICY "Admins can delete product variations"
  ON product_variations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_product_variations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_product_variations_updated_at_trigger ON product_variations;
CREATE TRIGGER update_product_variations_updated_at_trigger
  BEFORE UPDATE ON product_variations
  FOR EACH ROW
  EXECUTE FUNCTION update_product_variations_updated_at();