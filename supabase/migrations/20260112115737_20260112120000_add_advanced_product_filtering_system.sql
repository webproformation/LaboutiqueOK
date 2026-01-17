/*
  # Système avancé de filtrage et de gestion des couleurs

  1. Vérification colonnes couleurs (déjà ajoutées)
    - color_family, swatch_type, swatch_image, dominant_color

  2. Nouvelle table category_filter_config
    - Configuration des filtres actifs par catégorie
    - Ex: ["size", "color", "comfort", "fit", "live"]

  3. Nouvelle table product_live_tags
    - Gestion des tags Live pour filtrer les produits
    - is_new, seen_in_live

  4. Nouvelle table color_family_mappings
    - Mappage automatique des couleurs vers des familles
    - Editable depuis l'admin

  5. Sécurité
    - RLS avec is_admin pour toutes les tables
*/

-- ============================================
-- 1. TABLE DE CONFIGURATION DES FILTRES PAR CATÉGORIE
-- ============================================

CREATE TABLE IF NOT EXISTS category_filter_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  enabled_filters JSONB DEFAULT '[]'::jsonb,
  filter_order JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(category_id)
);

CREATE INDEX IF NOT EXISTS idx_category_filter_config_category
  ON category_filter_config(category_id);

-- ============================================
-- 2. TABLE DES TAGS LIVE
-- ============================================

CREATE TABLE IF NOT EXISTS product_live_tags (
  product_id TEXT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  is_new BOOLEAN DEFAULT false,
  seen_in_live BOOLEAN DEFAULT false,
  live_date TIMESTAMPTZ,
  live_stream_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_live_tags_seen_in_live
  ON product_live_tags(seen_in_live)
  WHERE seen_in_live = true;

CREATE INDEX IF NOT EXISTS idx_product_live_tags_is_new
  ON product_live_tags(is_new)
  WHERE is_new = true;

-- ============================================
-- 3. TABLE MAPPAGE COULEURS VERS FAMILLES
-- ============================================

CREATE TABLE IF NOT EXISTS color_family_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  color_term_id UUID NOT NULL REFERENCES product_attribute_terms(id) ON DELETE CASCADE,
  suggested_family TEXT NOT NULL,
  confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(color_term_id)
);

CREATE INDEX IF NOT EXISTS idx_color_family_mappings_confirmed
  ON color_family_mappings(confirmed);

-- ============================================
-- 4. INSERTION DONNÉES PAR DÉFAUT
-- ============================================

DO $$
DECLARE
  cat_id TEXT;
BEGIN
  FOR cat_id IN
    SELECT id FROM categories
    WHERE slug ILIKE '%pret-a-porter%'
       OR slug ILIKE '%vetements%'
       OR slug ILIKE '%mode%'
  LOOP
    INSERT INTO category_filter_config (category_id, enabled_filters, filter_order)
    VALUES (
      cat_id,
      '["size", "color", "comfort", "fit", "live"]'::jsonb,
      '["size", "color", "comfort", "fit", "live"]'::jsonb
    )
    ON CONFLICT (category_id) DO NOTHING;
  END LOOP;

  FOR cat_id IN
    SELECT id FROM categories
    WHERE slug ILIKE '%maison%'
       OR slug ILIKE '%deco%'
       OR slug ILIKE '%interieur%'
  LOOP
    INSERT INTO category_filter_config (category_id, enabled_filters, filter_order)
    VALUES (
      cat_id,
      '["color", "scent", "material", "live"]'::jsonb,
      '["color", "scent", "material", "live"]'::jsonb
    )
    ON CONFLICT (category_id) DO NOTHING;
  END LOOP;
END $$;

-- ============================================
-- 5. POLITIQUES RLS - category_filter_config
-- ============================================

ALTER TABLE category_filter_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Filtres de catégorie visibles publiquement"
  ON category_filter_config
  FOR SELECT
  USING (true);

CREATE POLICY "Admins peuvent gérer les filtres de catégorie"
  ON category_filter_config
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

-- ============================================
-- 6. POLITIQUES RLS - product_live_tags
-- ============================================

ALTER TABLE product_live_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags live visibles publiquement"
  ON product_live_tags
  FOR SELECT
  USING (true);

CREATE POLICY "Admins peuvent gérer les tags live"
  ON product_live_tags
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

-- ============================================
-- 7. POLITIQUES RLS - color_family_mappings
-- ============================================

ALTER TABLE color_family_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mappages de couleurs visibles publiquement"
  ON color_family_mappings
  FOR SELECT
  USING (true);

CREATE POLICY "Admins peuvent gérer les mappages de couleurs"
  ON color_family_mappings
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

-- ============================================
-- 8. FONCTION D'ANALYSE AUTOMATIQUE DES COULEURS
-- ============================================

CREATE OR REPLACE FUNCTION suggest_color_family(color_name TEXT)
RETURNS TEXT AS $$
DECLARE
  lower_name TEXT := LOWER(color_name);
BEGIN
  IF lower_name ~ '(blanc|white|ecru|ivoire|creme|beige clair)' THEN
    RETURN 'Blanc';
  ELSIF lower_name ~ '(noir|black|anthracite|charbon)' THEN
    RETURN 'Noir';
  ELSIF lower_name ~ '(gris|grey|gray|argent|silver|perle)' THEN
    RETURN 'Gris';
  ELSIF lower_name ~ '(beige|taupe|sable|camel|noisette|nude)' THEN
    RETURN 'Beige';
  ELSIF lower_name ~ '(marron|brown|brun|chocolat|cognac|caramel|terre)' THEN
    RETURN 'Marron';
  ELSIF lower_name ~ '(rouge|red|bordeaux|grenat|pourpre|carmin|cerise)' THEN
    RETURN 'Rouge';
  ELSIF lower_name ~ '(rose|pink|fuchsia|magenta|saumon)' THEN
    RETURN 'Rose';
  ELSIF lower_name ~ '(orange|corail|abricot|peche|mandarine)' THEN
    RETURN 'Orange';
  ELSIF lower_name ~ '(jaune|yellow|or|gold|moutarde|safran|citron)' THEN
    RETURN 'Jaune';
  ELSIF lower_name ~ '(vert|green|canard|sapin|olive|kaki|emeraude|menthe)' THEN
    RETURN 'Vert';
  ELSIF lower_name ~ '(bleu|blue|marine|navy|cyan|turquoise|petrole|indigo|azur)' THEN
    RETURN 'Bleu';
  ELSIF lower_name ~ '(violet|purple|mauve|lavande|lilas|prune|aubergine)' THEN
    RETURN 'Violet';
  ELSIF lower_name ~ '(multicolore|multi|imprime|motif|fleur|rayure)' THEN
    RETURN 'Multicolore';
  ELSIF lower_name ~ '(metal|dore|argente|bronze|cuivre|brillant)' THEN
    RETURN 'Métallisé';
  ELSE
    RETURN 'Autre';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 9. MAPPAGE AUTOMATIQUE DES COULEURS EXISTANTES
-- ============================================

DO $$
DECLARE
  color_term RECORD;
  suggested_family TEXT;
BEGIN
  FOR color_term IN
    SELECT pat.id, pat.name
    FROM product_attribute_terms pat
    INNER JOIN product_attributes pa ON pa.id = pat.attribute_id
    WHERE pa.slug = 'couleur'
  LOOP
    suggested_family := suggest_color_family(color_term.name);

    INSERT INTO color_family_mappings (
      color_term_id,
      suggested_family,
      confirmed
    )
    VALUES (
      color_term.id,
      suggested_family,
      false
    )
    ON CONFLICT (color_term_id) DO NOTHING;

    UPDATE product_attribute_terms
    SET color_family = suggested_family
    WHERE id = color_term.id
    AND color_family IS NULL;
  END LOOP;
END $$;

-- ============================================
-- 10. TRIGGER POUR MAPPAGE AUTO DES NOUVELLES COULEURS
-- ============================================

CREATE OR REPLACE FUNCTION auto_map_color_family()
RETURNS TRIGGER AS $$
DECLARE
  is_color_attribute BOOLEAN;
  suggested_family TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM product_attributes
    WHERE id = NEW.attribute_id
    AND slug = 'couleur'
  ) INTO is_color_attribute;

  IF is_color_attribute THEN
    suggested_family := suggest_color_family(NEW.name);
    NEW.color_family := suggested_family;
    
    IF NEW.swatch_type IS NULL THEN
      NEW.swatch_type := 'color';
    END IF;

    INSERT INTO color_family_mappings (
      color_term_id,
      suggested_family,
      confirmed
    )
    VALUES (
      NEW.id,
      suggested_family,
      false
    )
    ON CONFLICT (color_term_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_map_color_family ON product_attribute_terms;
CREATE TRIGGER trigger_auto_map_color_family
  BEFORE INSERT ON product_attribute_terms
  FOR EACH ROW
  EXECUTE FUNCTION auto_map_color_family();