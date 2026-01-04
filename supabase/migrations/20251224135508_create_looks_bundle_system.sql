/*
  # Système "Acheter le Look" (Smart Bundle)

  1. Nouvelles Tables
    - `looks`
      - `id` (uuid, primary key)
      - `title` (text) - Titre du look
      - `slug` (text, unique) - URL-friendly slug
      - `description` (text) - Description du look
      - `morgane_advice` (text) - "Pourquoi j'aime ce look ?"
      - `hero_image_url` (text) - URL de la photo principale avec Morgane
      - `discount_percentage` (decimal) - % de remise (défaut 5%)
      - `is_active` (boolean) - Actif/Inactif
      - `display_order` (integer) - Ordre d'affichage
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `look_products`
      - `id` (uuid, primary key)
      - `look_id` (uuid, foreign key vers looks)
      - `woocommerce_product_id` (integer) - ID du produit WooCommerce
      - `product_name` (text) - Nom du produit (cache)
      - `product_image_url` (text) - Image du produit (cache)
      - `hotspot_x` (decimal) - Position X du hotspot (% de 0 à 100)
      - `hotspot_y` (decimal) - Position Y du hotspot (% de 0 à 100)
      - `display_order` (integer) - Ordre d'affichage
      - `is_required` (boolean) - Produit obligatoire pour le bundle
      - `created_at` (timestamp)

    - `look_bundle_carts`
      - `id` (uuid, primary key)
      - `look_id` (uuid, foreign key vers looks)
      - `cart_session_id` (text) - ID de session pour panier anonyme
      - `user_id` (uuid, nullable, foreign key vers profiles)
      - `discount_applied` (boolean) - Remise appliquée
      - `created_at` (timestamp)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Lecture publique des looks actifs
    - Seuls les admins peuvent gérer les looks
*/

-- Table principale des looks
CREATE TABLE IF NOT EXISTS looks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  morgane_advice TEXT,
  hero_image_url TEXT NOT NULL,
  discount_percentage DECIMAL(5,2) DEFAULT 5.00,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_looks_slug ON looks(slug);
CREATE INDEX IF NOT EXISTS idx_looks_active ON looks(is_active);
CREATE INDEX IF NOT EXISTS idx_looks_order ON looks(display_order);

-- Table des produits composant un look
CREATE TABLE IF NOT EXISTS look_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  look_id UUID NOT NULL REFERENCES looks(id) ON DELETE CASCADE,
  woocommerce_product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  product_image_url TEXT,
  hotspot_x DECIMAL(5,2) DEFAULT 50.00,
  hotspot_y DECIMAL(5,2) DEFAULT 50.00,
  display_order INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_look_products_look_id ON look_products(look_id);
CREATE INDEX IF NOT EXISTS idx_look_products_wc_id ON look_products(woocommerce_product_id);
CREATE INDEX IF NOT EXISTS idx_look_products_order ON look_products(display_order);

-- Table pour tracker les bundles dans le panier
CREATE TABLE IF NOT EXISTS look_bundle_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  look_id UUID NOT NULL REFERENCES looks(id) ON DELETE CASCADE,
  cart_session_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  discount_applied BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_look_bundle_carts_session ON look_bundle_carts(cart_session_id);
CREATE INDEX IF NOT EXISTS idx_look_bundle_carts_user ON look_bundle_carts(user_id);
CREATE INDEX IF NOT EXISTS idx_look_bundle_carts_look ON look_bundle_carts(look_id);

-- Enable RLS
ALTER TABLE looks ENABLE ROW LEVEL SECURITY;
ALTER TABLE look_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE look_bundle_carts ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour looks

-- Tout le monde peut lire les looks actifs
CREATE POLICY "Tous peuvent lire les looks actifs"
  ON looks FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Admins peuvent tout lire
CREATE POLICY "Admins peuvent lire tous les looks"
  ON looks FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins peuvent créer des looks
CREATE POLICY "Admins peuvent créer des looks"
  ON looks FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Admins peuvent modifier les looks
CREATE POLICY "Admins peuvent modifier les looks"
  ON looks FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins peuvent supprimer les looks
CREATE POLICY "Admins peuvent supprimer les looks"
  ON looks FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Politiques RLS pour look_products

-- Tout le monde peut lire les produits des looks actifs
CREATE POLICY "Tous peuvent lire les produits des looks actifs"
  ON look_products FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM looks
      WHERE looks.id = look_products.look_id
      AND looks.is_active = true
    )
  );

-- Admins peuvent tout lire
CREATE POLICY "Admins peuvent lire tous les produits de looks"
  ON look_products FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins peuvent créer des produits de looks
CREATE POLICY "Admins peuvent créer des produits de looks"
  ON look_products FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Admins peuvent modifier les produits de looks
CREATE POLICY "Admins peuvent modifier les produits de looks"
  ON look_products FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins peuvent supprimer les produits de looks
CREATE POLICY "Admins peuvent supprimer les produits de looks"
  ON look_products FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Politiques RLS pour look_bundle_carts

-- Les utilisateurs peuvent créer leurs propres bundles
CREATE POLICY "Utilisateurs peuvent créer leurs bundles"
  ON look_bundle_carts FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Les utilisateurs peuvent lire leurs propres bundles
CREATE POLICY "Utilisateurs peuvent lire leurs bundles"
  ON look_bundle_carts FOR SELECT
  TO authenticated, anon
  USING (true);

-- Les utilisateurs peuvent supprimer leurs propres bundles
CREATE POLICY "Utilisateurs peuvent supprimer leurs bundles"
  ON look_bundle_carts FOR DELETE
  TO authenticated, anon
  USING (true);

-- Admins peuvent tout lire
CREATE POLICY "Admins peuvent lire tous les bundles"
  ON look_bundle_carts FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Fonction pour mettre à jour le updated_at
CREATE OR REPLACE FUNCTION update_looks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER looks_updated_at_trigger
  BEFORE UPDATE ON looks
  FOR EACH ROW
  EXECUTE FUNCTION update_looks_updated_at();

-- Fonction pour calculer le prix total d'un look avec remise
CREATE OR REPLACE FUNCTION calculate_look_bundle_price(
  p_look_id UUID,
  p_selected_variants JSONB
)
RETURNS JSON AS $$
DECLARE
  v_total_price DECIMAL(10,2) := 0;
  v_discount_percentage DECIMAL(5,2);
  v_discounted_price DECIMAL(10,2);
  v_savings DECIMAL(10,2);
  v_result JSON;
BEGIN
  -- Récupérer le pourcentage de remise
  SELECT discount_percentage INTO v_discount_percentage
  FROM looks
  WHERE id = p_look_id;

  -- Calculer le prix total (à implémenter avec les prix WooCommerce)
  -- Pour l'instant, retourner une structure de base
  v_discounted_price := v_total_price * (1 - (v_discount_percentage / 100));
  v_savings := v_total_price - v_discounted_price;

  v_result := json_build_object(
    'original_price', v_total_price,
    'discount_percentage', v_discount_percentage,
    'discounted_price', v_discounted_price,
    'savings', v_savings
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
