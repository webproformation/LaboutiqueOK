/*
  # Création du système Les Looks de Morgane

  1. Nouvelles Tables
    - `looks` : Looks complets avec remise bundle
    - `look_products` : Produits composant chaque look avec hotspots
    - `look_bundle_carts` : Tracking des bundles dans les paniers
  
  2. Sécurité
    - RLS activé sur toutes les tables
    - Looks: Admin pour écriture, public pour lecture (is_active)
    - Look products: Admin pour écriture, public pour lecture
    - Bundle carts: Utilisateurs pour leurs propres paniers
  
  3. Fonctionnalités
    - Hotspots cliquables sur l'image (hotspot_x, hotspot_y)
    - Remise automatique sur le bundle complet
    - Produits obligatoires vs optionnels
    - Ordre d'affichage personnalisable
    - Conseil personnalisé de Morgane
*/

-- Table principale des looks
CREATE TABLE IF NOT EXISTS looks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  morgane_advice text,
  hero_image_url text NOT NULL,
  discount_percentage decimal(5,2) DEFAULT 5.00 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_looks_slug ON looks(slug);
CREATE INDEX IF NOT EXISTS idx_looks_active ON looks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_looks_order ON looks(display_order);

ALTER TABLE looks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active looks"
  ON looks
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admin can manage all looks"
  ON looks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Table des produits composant un look
CREATE TABLE IF NOT EXISTS look_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  look_id uuid NOT NULL REFERENCES looks(id) ON DELETE CASCADE,
  woocommerce_product_id text NOT NULL,
  product_name text NOT NULL,
  product_image_url text,
  hotspot_x decimal(5,2) DEFAULT 50.00 CHECK (hotspot_x >= 0 AND hotspot_x <= 100),
  hotspot_y decimal(5,2) DEFAULT 50.00 CHECK (hotspot_y >= 0 AND hotspot_y <= 100),
  display_order integer DEFAULT 0,
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_look_products_look_id ON look_products(look_id);
CREATE INDEX IF NOT EXISTS idx_look_products_wc_id ON look_products(woocommerce_product_id);
CREATE INDEX IF NOT EXISTS idx_look_products_order ON look_products(look_id, display_order);

ALTER TABLE look_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view look products"
  ON look_products
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM looks
      WHERE looks.id = look_products.look_id
      AND looks.is_active = true
    )
  );

CREATE POLICY "Admin can manage look products"
  ON look_products
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Table pour tracker les bundles dans le panier
CREATE TABLE IF NOT EXISTS look_bundle_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  look_id uuid NOT NULL REFERENCES looks(id) ON DELETE CASCADE,
  cart_session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  discount_applied boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_look_bundle_carts_session ON look_bundle_carts(cart_session_id);
CREATE INDEX IF NOT EXISTS idx_look_bundle_carts_user ON look_bundle_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_look_bundle_carts_look ON look_bundle_carts(look_id);

ALTER TABLE look_bundle_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bundle carts"
  ON look_bundle_carts
  FOR ALL
  TO anon, authenticated
  USING (
    cart_session_id = current_setting('request.headers')::json->>'x-session-id' 
    OR auth.uid() = user_id
  );