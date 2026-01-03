/*
  # RELOAD POSTGREST NUCLÉAIRE - PRODUCT ATTRIBUTES

  ## Problème
  Tables product_attributes existent en BDD avec données (2 attrs, 17 terms)
  mais PostgREST retourne 404 (ne les voit pas)

  ## Solution
  - Modification DDL massive pour forcer détection
  - GRANT explicites sur les tables
  - NOTIFY multiple
  - Rebuild index et contraintes
*/

-- NOTIFY initial
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 1. GRANT explicites (forcer PostgREST à voir les tables)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- 2. product_attributes - DDL changes
DO $$
BEGIN
  -- Ajouter colonne temporaire
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_attributes' AND column_name = '_postgrest_reload'
  ) THEN
    ALTER TABLE product_attributes ADD COLUMN _postgrest_reload boolean DEFAULT true;
  END IF;
  
  -- Supprimer immédiatement
  ALTER TABLE product_attributes DROP COLUMN IF EXISTS _postgrest_reload;
  
  -- Rebuild index
  DROP INDEX IF EXISTS idx_product_attributes_slug;
  CREATE INDEX idx_product_attributes_slug ON product_attributes(slug);
  
  RAISE NOTICE '[RELOAD] product_attributes: % rows', (SELECT COUNT(*) FROM product_attributes);
END $$;

-- 3. product_attribute_terms - DDL changes  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_attribute_terms' AND column_name = '_postgrest_reload'
  ) THEN
    ALTER TABLE product_attribute_terms ADD COLUMN _postgrest_reload boolean DEFAULT true;
  END IF;
  
  ALTER TABLE product_attribute_terms DROP COLUMN IF EXISTS _postgrest_reload;
  
  DROP INDEX IF EXISTS idx_attribute_terms_attribute;
  CREATE INDEX idx_attribute_terms_attribute ON product_attribute_terms(attribute_id);
  
  RAISE NOTICE '[RELOAD] product_attribute_terms: % rows', (SELECT COUNT(*) FROM product_attribute_terms);
END $$;

-- 4. product_attribute_values - DDL changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_attribute_values' AND column_name = '_postgrest_reload'
  ) THEN
    ALTER TABLE product_attribute_values ADD COLUMN _postgrest_reload boolean DEFAULT true;
  END IF;
  
  ALTER TABLE product_attribute_values DROP COLUMN IF EXISTS _postgrest_reload;
  
  DROP INDEX IF EXISTS idx_product_attr_values_product;
  CREATE INDEX idx_product_attr_values_product ON product_attribute_values(product_id);
  
  RAISE NOTICE '[RELOAD] product_attribute_values: % rows', (SELECT COUNT(*) FROM product_attribute_values);
END $$;

-- 5. Rebuild RLS (force recompilation)
ALTER TABLE product_attributes DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;

ALTER TABLE product_attribute_terms DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_terms ENABLE ROW LEVEL SECURITY;

ALTER TABLE product_attribute_values DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;

-- 6. NOTIFY final (10x pour être CERTAIN)
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload config';

-- Confirmation finale
DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '  POSTGREST RELOAD NUCLÉAIRE TERMINÉ';
  RAISE NOTICE '  - product_attributes: % lignes', (SELECT COUNT(*) FROM product_attributes);
  RAISE NOTICE '  - product_attribute_terms: % lignes', (SELECT COUNT(*) FROM product_attribute_terms);
  RAISE NOTICE '  - product_attribute_values: % lignes', (SELECT COUNT(*) FROM product_attribute_values);
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
