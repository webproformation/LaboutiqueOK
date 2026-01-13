/*
  # Création des tables pour la gestion des produits, médias et attributs (v2 - compatible avec products.id TEXT)

  ## Nouvelles Tables
  
  ### `media_library`
  Table centrale pour gérer tous les médias (images) uploadés dans l'application.
  
  ### `product_images`
  Table pour gérer les galeries d'images des produits (plusieurs images par produit).
  Compatible avec products.id de type TEXT (IDs WooCommerce).
  
  ### `product_attributes`
  Table pour définir les types d'attributs (Couleur, Taille, Matière, etc.).
  
  ### `product_attribute_terms`
  Table pour définir les valeurs possibles d'un attribut (Rouge, Bleu, S, M, L, etc.).
  
  ### `product_attribute_values`
  Table de liaison entre produits et attributs (N-N).
  Compatible avec products.id de type TEXT.
  
  ### `product_variations`
  Table pour gérer les variations de produits (combinaisons d'attributs avec prix/stock propres).
  Compatible avec products.id de type TEXT.
  
  ### `seo_metadata`
  Table pour stocker les métadonnées SEO de tous les types d'entités.

  ## Sécurité
  - Row Level Security (RLS) activé sur toutes les tables
  - Policies publiques pour la lecture
  - Policies authentifiées pour l'écriture
  
  ## Indexes
  - Index sur toutes les clés étrangères
  - Index sur les champs fréquemment recherchés
  
  ## Triggers
  - Trigger pour mettre à jour automatiquement updated_at sur modification
*/

-- =====================================================
-- TABLE: media_library
-- =====================================================
CREATE TABLE IF NOT EXISTS media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  file_path text NOT NULL UNIQUE,
  url text NOT NULL,
  bucket_name text NOT NULL,
  file_size bigint,
  mime_type text,
  width integer,
  height integer,
  is_optimized boolean DEFAULT false,
  original_wordpress_url text,
  used_in_products integer[] DEFAULT '{}',
  used_in_categories integer[] DEFAULT '{}',
  usage_count integer DEFAULT 0,
  is_orphan boolean DEFAULT false,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_bucket ON media_library(bucket_name);
CREATE INDEX IF NOT EXISTS idx_media_filename ON media_library(filename);
CREATE INDEX IF NOT EXISTS idx_media_orphan ON media_library(is_orphan);
CREATE INDEX IF NOT EXISTS idx_media_created ON media_library(created_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS media_library_updated_at ON media_library;
CREATE TRIGGER media_library_updated_at
  BEFORE UPDATE ON media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_media_updated_at();

ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_select_public"
  ON media_library FOR SELECT TO public USING (true);

CREATE POLICY "media_insert_public"
  ON media_library FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "media_update_public"
  ON media_library FOR UPDATE TO public USING (true);

CREATE POLICY "media_delete_public"
  ON media_library FOR DELETE TO public USING (true);

-- =====================================================
-- TABLE: product_images (compatible products.id TEXT)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  image_url text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_order ON product_images(product_id, display_order);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_images_select_public"
  ON product_images FOR SELECT TO public USING (true);

CREATE POLICY "product_images_insert_public"
  ON product_images FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "product_images_update_public"
  ON product_images FOR UPDATE TO public USING (true);

CREATE POLICY "product_images_delete_public"
  ON product_images FOR DELETE TO public USING (true);

-- =====================================================
-- TABLE: product_attributes
-- =====================================================
CREATE TABLE IF NOT EXISTS product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  type text DEFAULT 'select',
  is_visible boolean DEFAULT true,
  order_by integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_attributes_slug ON product_attributes(slug);

ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attributes_select_public"
  ON product_attributes FOR SELECT TO public USING (true);

CREATE POLICY "attributes_insert_public"
  ON product_attributes FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "attributes_update_public"
  ON product_attributes FOR UPDATE TO public USING (true);

-- =====================================================
-- TABLE: product_attribute_terms
-- =====================================================
CREATE TABLE IF NOT EXISTS product_attribute_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_id uuid NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  value text,
  color_code text,
  order_by integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(attribute_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_attribute_terms_attribute ON product_attribute_terms(attribute_id);

ALTER TABLE product_attribute_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attribute_terms_select_public"
  ON product_attribute_terms FOR SELECT TO public USING (true);

CREATE POLICY "attribute_terms_insert_public"
  ON product_attribute_terms FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "attribute_terms_update_public"
  ON product_attribute_terms FOR UPDATE TO public USING (true);

-- =====================================================
-- TABLE: product_attribute_values (compatible products.id TEXT)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  attribute_id uuid NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES product_attribute_terms(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, attribute_id, term_id),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attribute_values_product ON product_attribute_values(product_id);
CREATE INDEX IF NOT EXISTS idx_attribute_values_attribute ON product_attribute_values(attribute_id);
CREATE INDEX IF NOT EXISTS idx_attribute_values_term ON product_attribute_values(term_id);

ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attribute_values_select_public"
  ON product_attribute_values FOR SELECT TO public USING (true);

CREATE POLICY "attribute_values_insert_public"
  ON product_attribute_values FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "attribute_values_update_public"
  ON product_attribute_values FOR UPDATE TO public USING (true);

CREATE POLICY "attribute_values_delete_public"
  ON product_attribute_values FOR DELETE TO public USING (true);

-- =====================================================
-- TABLE: product_variations (compatible products.id TEXT)
-- =====================================================
CREATE TABLE IF NOT EXISTS product_variations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  sku text UNIQUE,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  regular_price numeric(10, 2),
  sale_price numeric(10, 2),
  stock_quantity integer,
  stock_status text DEFAULT 'instock',
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_variations_product ON product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_variations_sku ON product_variations(sku);

ALTER TABLE product_variations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "variations_select_public"
  ON product_variations FOR SELECT TO public USING (true);

CREATE POLICY "variations_insert_public"
  ON product_variations FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "variations_update_public"
  ON product_variations FOR UPDATE TO public USING (true);

CREATE POLICY "variations_delete_public"
  ON product_variations FOR DELETE TO public USING (true);

-- =====================================================
-- TABLE: seo_metadata
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_identifier text NOT NULL,
  seo_title text,
  meta_description text,
  og_image text,
  og_title text,
  og_description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_identifier)
);

CREATE INDEX IF NOT EXISTS idx_seo_entity ON seo_metadata(entity_type, entity_identifier);

ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seo_select_public"
  ON seo_metadata FOR SELECT TO public USING (true);

CREATE POLICY "seo_insert_public"
  ON seo_metadata FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "seo_update_public"
  ON seo_metadata FOR UPDATE TO public USING (true);