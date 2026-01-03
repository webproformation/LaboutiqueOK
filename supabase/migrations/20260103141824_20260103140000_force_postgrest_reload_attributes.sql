/*
  # RAFRAÎCHISSEMENT BRUTAL POSTGREST - ATTRIBUTES

  ## Problème
  Les tables product_attributes existent et contiennent des données,
  mais PostgREST retourne 404 (cache périmé)

  ## Solution
  - Forcer reload schema via NOTIFY
  - Modification DDL pour invalider le cache
  - Rebuild des permissions RLS
*/

-- 1. NOTIFY direct
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 2. Modification DDL (force invalidation cache)
DO $$
BEGIN
  -- Drop et recréer une colonne temporaire pour forcer le reload
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_attributes' AND column_name = '_cache_buster'
  ) THEN
    ALTER TABLE product_attributes DROP COLUMN _cache_buster;
  END IF;
  
  ALTER TABLE product_attributes ADD COLUMN _cache_buster boolean DEFAULT true;
  ALTER TABLE product_attributes DROP COLUMN _cache_buster;
END $$;

-- 3. Rebuild des RLS policies (force PostgreSQL à recompiler)
DROP POLICY IF EXISTS "Public read access for product attributes" ON product_attributes;
DROP POLICY IF EXISTS "Admins can manage product attributes" ON product_attributes;

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

-- Même chose pour les termes
DROP POLICY IF EXISTS "Public read access for attribute terms" ON product_attribute_terms;
DROP POLICY IF EXISTS "Admins can manage attribute terms" ON product_attribute_terms;

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

-- 4. NOTIFY final
NOTIFY pgrst, 'reload schema';

-- 5. Confirmation
DO $$
BEGIN
  RAISE NOTICE '[POSTGREST RELOAD] Tables attributes: % attributs, % termes',
    (SELECT COUNT(*) FROM product_attributes),
    (SELECT COUNT(*) FROM product_attribute_terms);
END $$;
