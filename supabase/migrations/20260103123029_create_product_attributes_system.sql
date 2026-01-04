/*
  # SYSTÈME D'ATTRIBUTS PRODUITS AUTONOME

  ## Vue d'ensemble
  Création d'un système complet d'attributs produits dans Supabase
  pour éliminer la dépendance à WordPress/WooCommerce.

  ## Nouvelles Tables

  ### 1. `product_attributes`
  Table principale des attributs (ex: Couleur, Taille, Matière)
  - `id` (uuid, primary key)
  - `name` (text) - Nom de l'attribut
  - `slug` (text) - Slug pour URL
  - `type` (text) - Type: 'select', 'color', 'button'
  - `woocommerce_id` (integer) - ID WooCommerce pour sync
  - `order_by` (integer) - Ordre d'affichage
  - `is_visible` (boolean) - Visible sur le site
  - `is_variation` (boolean) - Utilisé pour les variations
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `product_attribute_terms`
  Valeurs possibles pour chaque attribut (ex: Rouge, Bleu, S, M, L)
  - `id` (uuid, primary key)
  - `attribute_id` (uuid, foreign key → product_attributes)
  - `name` (text) - Nom du terme
  - `slug` (text) - Slug pour URL
  - `value` (text) - Valeur réelle (ex: code couleur #FF0000)
  - `woocommerce_id` (integer) - ID WooCommerce pour sync
  - `order_by` (integer) - Ordre d'affichage
  - `is_active` (boolean) - Actif sur le site
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `product_attribute_values`
  Association produit ↔ attributs (ex: Produit X a Couleur=Rouge, Taille=M)
  - `id` (uuid, primary key)
  - `product_id` (uuid, foreign key → products)
  - `attribute_id` (uuid, foreign key → product_attributes)
  - `term_id` (uuid, foreign key → product_attribute_terms)
  - `is_variation` (boolean) - Si cet attribut crée une variation
  - `created_at` (timestamptz)

  ## Sécurité
  - RLS activé sur toutes les tables
  - Lecture publique pour l'affichage
  - Modification réservée aux admins

  ## Index
  - Index sur woocommerce_id pour sync rapide
  - Index sur les foreign keys pour les jointures
  - Index sur slug pour recherche
*/

-- =============================================================================
-- TABLE: product_attributes
-- =============================================================================

CREATE TABLE IF NOT EXISTS product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  type text NOT NULL DEFAULT 'select', -- 'select', 'color', 'button', 'text'
  woocommerce_id integer UNIQUE,
  order_by integer DEFAULT 0,
  is_visible boolean DEFAULT true,
  is_variation boolean DEFAULT false, -- Si l'attribut peut créer des variations
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_product_attributes_slug ON product_attributes(slug);
CREATE INDEX IF NOT EXISTS idx_product_attributes_woo_id ON product_attributes(woocommerce_id);
CREATE INDEX IF NOT EXISTS idx_product_attributes_visible ON product_attributes(is_visible) WHERE is_visible = true;

-- RLS
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for product attributes"
  ON product_attributes FOR SELECT
  TO public
  USING (is_visible = true);

CREATE POLICY "Admins can manage product attributes"
  ON product_attributes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: product_attribute_terms
-- =============================================================================

CREATE TABLE IF NOT EXISTS product_attribute_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id uuid NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  value text, -- Valeur réelle (ex: code couleur, taille en cm, etc.)
  woocommerce_id integer,
  order_by integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(attribute_id, slug)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_attribute_terms_attribute ON product_attribute_terms(attribute_id);
CREATE INDEX IF NOT EXISTS idx_attribute_terms_slug ON product_attribute_terms(slug);
CREATE INDEX IF NOT EXISTS idx_attribute_terms_woo_id ON product_attribute_terms(woocommerce_id);
CREATE INDEX IF NOT EXISTS idx_attribute_terms_active ON product_attribute_terms(is_active) WHERE is_active = true;

-- RLS
ALTER TABLE product_attribute_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for attribute terms"
  ON product_attribute_terms FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage attribute terms"
  ON product_attribute_terms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- =============================================================================
-- TABLE: product_attribute_values
-- =============================================================================

CREATE TABLE IF NOT EXISTS product_attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_id uuid NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES product_attribute_terms(id) ON DELETE CASCADE,
  is_variation boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, attribute_id, term_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_product_attr_values_product ON product_attribute_values(product_id);
CREATE INDEX IF NOT EXISTS idx_product_attr_values_attribute ON product_attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_product_attr_values_term ON product_attribute_values(term_id);
CREATE INDEX IF NOT EXISTS idx_product_attr_values_variation ON product_attribute_values(is_variation) WHERE is_variation = true;

-- RLS
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for product attribute values"
  ON product_attribute_values FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can manage product attribute values"
  ON product_attribute_values FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- =============================================================================
-- FONCTIONS HELPER
-- =============================================================================

-- Fonction pour récupérer tous les attributs d'un produit
CREATE OR REPLACE FUNCTION get_product_attributes(p_product_id uuid)
RETURNS TABLE (
  attribute_name text,
  attribute_slug text,
  attribute_type text,
  term_name text,
  term_value text,
  is_variation boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.name,
    pa.slug,
    pa.type,
    pat.name,
    pat.value,
    pav.is_variation
  FROM product_attribute_values pav
  JOIN product_attributes pa ON pa.id = pav.attribute_id
  JOIN product_attribute_terms pat ON pat.id = pav.term_id
  WHERE pav.product_id = p_product_id
  AND pa.is_visible = true
  AND pat.is_active = true
  ORDER BY pa.order_by, pat.order_by;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Fonction pour récupérer tous les termes d'un attribut
CREATE OR REPLACE FUNCTION get_attribute_terms(p_attribute_slug text)
RETURNS TABLE (
  term_id uuid,
  term_name text,
  term_slug text,
  term_value text,
  term_order integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pat.id,
    pat.name,
    pat.slug,
    pat.value,
    pat.order_by
  FROM product_attribute_terms pat
  JOIN product_attributes pa ON pa.id = pat.attribute_id
  WHERE pa.slug = p_attribute_slug
  AND pa.is_visible = true
  AND pat.is_active = true
  ORDER BY pat.order_by, pat.name;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =============================================================================
-- DONNÉES INITIALES (Exemple: Couleur et Taille)
-- =============================================================================

-- Attribut: Couleur
INSERT INTO product_attributes (name, slug, type, order_by, is_visible, is_variation)
VALUES ('Couleur', 'couleur', 'color', 1, true, true)
ON CONFLICT (slug) DO NOTHING;

-- Attribut: Taille
INSERT INTO product_attributes (name, slug, type, order_by, is_visible, is_variation)
VALUES ('Taille', 'taille', 'button', 2, true, true)
ON CONFLICT (slug) DO NOTHING;

-- Termes pour Couleur (exemples)
WITH couleur_attr AS (
  SELECT id FROM product_attributes WHERE slug = 'couleur'
)
INSERT INTO product_attribute_terms (attribute_id, name, slug, value, order_by)
SELECT
  couleur_attr.id,
  name,
  slug,
  value,
  order_by
FROM couleur_attr, (VALUES
  ('Noir', 'noir', '#000000', 1),
  ('Blanc', 'blanc', '#FFFFFF', 2),
  ('Rouge', 'rouge', '#FF0000', 3),
  ('Bleu', 'bleu', '#0000FF', 4),
  ('Vert', 'vert', '#00FF00', 5),
  ('Rose', 'rose', '#FFC0CB', 6),
  ('Beige', 'beige', '#F5F5DC', 7),
  ('Gris', 'gris', '#808080', 8),
  ('Marron', 'marron', '#8B4513', 9),
  ('Orange', 'orange', '#FFA500', 10)
) AS v(name, slug, value, order_by)
ON CONFLICT (attribute_id, slug) DO NOTHING;

-- Termes pour Taille (exemples)
WITH taille_attr AS (
  SELECT id FROM product_attributes WHERE slug = 'taille'
)
INSERT INTO product_attribute_terms (attribute_id, name, slug, value, order_by)
SELECT
  taille_attr.id,
  name,
  slug,
  NULL,
  order_by
FROM taille_attr, (VALUES
  ('XS', 'xs', 1),
  ('S', 's', 2),
  ('M', 'm', 3),
  ('L', 'l', 4),
  ('XL', 'xl', 5),
  ('XXL', 'xxl', 6),
  ('Unique', 'unique', 7)
) AS v(name, slug, order_by)
ON CONFLICT (attribute_id, slug) DO NOTHING;

-- =============================================================================
-- COMMENTAIRES
-- =============================================================================

COMMENT ON TABLE product_attributes IS 'Définition des attributs produits (Couleur, Taille, etc.)';
COMMENT ON TABLE product_attribute_terms IS 'Valeurs possibles pour chaque attribut (Rouge, Bleu, S, M, L, etc.)';
COMMENT ON TABLE product_attribute_values IS 'Association produit ↔ attributs';
COMMENT ON FUNCTION get_product_attributes IS 'Récupère tous les attributs d''un produit avec leurs valeurs';
COMMENT ON FUNCTION get_attribute_terms IS 'Récupère tous les termes d''un attribut donné';
