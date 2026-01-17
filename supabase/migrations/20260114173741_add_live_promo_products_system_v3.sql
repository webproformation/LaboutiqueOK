/*
  # Système de produits Live avec prix promo temporaire
  
  1. Modifications de la table `live_shared_products`
    - `live_product_id` (text) - ID du produit dupliqué spécifique au live (avec SKU -live)
    - `promo_price` (decimal) - Prix promo pendant le live
    - `original_price` (decimal) - Prix original du produit
    - `live_sku` (text) - SKU modifié avec -live
    - `is_published` (boolean) - Publié pour tous les utilisateurs
    - `published_at` (timestamptz) - Date de publication
    - `expires_at` (timestamptz) - Date d'expiration (2h après le live)
    
  2. Vérification catégorie "LIVE & REPLAY"
    - Slug: live-replay
    - ID: 1768404743767-lfnpfit (déjà existant)
    
  3. Security
    - Policies RLS pour gérer les produits live
    - Accès public en lecture pour produits publiés
    - Admins uniquement en écriture
*/

-- Ajouter les colonnes manquantes à live_shared_products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_shared_products' AND column_name = 'live_product_id'
  ) THEN
    ALTER TABLE live_shared_products ADD COLUMN live_product_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_shared_products' AND column_name = 'promo_price'
  ) THEN
    ALTER TABLE live_shared_products ADD COLUMN promo_price decimal(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_shared_products' AND column_name = 'original_price'
  ) THEN
    ALTER TABLE live_shared_products ADD COLUMN original_price decimal(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_shared_products' AND column_name = 'live_sku'
  ) THEN
    ALTER TABLE live_shared_products ADD COLUMN live_sku text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_shared_products' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE live_shared_products ADD COLUMN is_published boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_shared_products' AND column_name = 'published_at'
  ) THEN
    ALTER TABLE live_shared_products ADD COLUMN published_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'live_shared_products' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE live_shared_products ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_live_shared_products_live_sku ON live_shared_products(live_sku);
CREATE INDEX IF NOT EXISTS idx_live_shared_products_expires_at ON live_shared_products(expires_at);
CREATE INDEX IF NOT EXISTS idx_live_shared_products_is_published ON live_shared_products(is_published);
CREATE INDEX IF NOT EXISTS idx_live_shared_products_live_product_id ON live_shared_products(live_product_id);

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Admins can manage shared products" ON live_shared_products;
DROP POLICY IF EXISTS "Public can view shared products" ON live_shared_products;
DROP POLICY IF EXISTS "Public can view published live products" ON live_shared_products;
DROP POLICY IF EXISTS "Admins can view all live products" ON live_shared_products;
DROP POLICY IF EXISTS "Anonymous can view published live products" ON live_shared_products;
DROP POLICY IF EXISTS "Admins can manage all live products" ON live_shared_products;

-- Politique pour que les admins puissent tout gérer
CREATE POLICY "Admins can manage all live products"
  ON live_shared_products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Politique pour que le public authentifié puisse voir les produits publiés et non expirés
CREATE POLICY "Authenticated can view published live products"
  ON live_shared_products FOR SELECT
  TO authenticated
  USING (
    is_published = true 
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Politique pour que le public anonyme puisse aussi voir les produits publiés
CREATE POLICY "Anonymous can view published live products"
  ON live_shared_products FOR SELECT
  TO anon
  USING (
    is_published = true 
    AND (expires_at IS NULL OR expires_at > now())
  );