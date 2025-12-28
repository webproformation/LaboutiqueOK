/*
  # Système de cache WooCommerce

  1. Nouvelles tables
    - `woocommerce_categories_cache`
      - Cache des catégories WooCommerce
      - Mise à jour automatique toutes les 5 minutes
    
  2. Sécurité
    - Permet la lecture publique
    - Les edge functions peuvent modifier via service role
*/

-- Table pour cacher les catégories WooCommerce
CREATE TABLE IF NOT EXISTS woocommerce_categories_cache (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent INTEGER DEFAULT 0,
  description TEXT,
  image JSONB,
  count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_woo_categories_parent ON woocommerce_categories_cache(parent);
CREATE INDEX IF NOT EXISTS idx_woo_categories_slug ON woocommerce_categories_cache(slug);
CREATE INDEX IF NOT EXISTS idx_woo_categories_updated ON woocommerce_categories_cache(updated_at);

-- RLS
ALTER TABLE woocommerce_categories_cache ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les catégories
CREATE POLICY "Anyone can read categories cache"
  ON woocommerce_categories_cache
  FOR SELECT
  USING (true);

-- Fonction pour vérifier si le cache est expiré (5 minutes)
CREATE OR REPLACE FUNCTION is_categories_cache_expired()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM woocommerce_categories_cache
    WHERE updated_at > now() - INTERVAL '5 minutes'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;