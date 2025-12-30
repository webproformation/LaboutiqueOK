-- ============================================================================
-- NETTOYAGE ET RECONSTRUCTION DES POLICIES RLS
-- ============================================================================
--
-- Ce script nettoie les policies RLS en double sur loyalty_points
-- et reconstruit une configuration propre
--
-- ============================================================================

-- 1. Supprimer toutes les policies sur loyalty_points
DROP POLICY IF EXISTS "Allow all to read loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "Allow authenticated to insert own loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "Allow insert for all on loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "Allow select for all on loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "Allow update for authenticated on loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "System can manage all loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "Ultra permissive select for all" ON loyalty_points;
DROP POLICY IF EXISTS "allow_all_delete_loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "allow_all_insert_loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "allow_all_select_loyalty_points" ON loyalty_points;
DROP POLICY IF EXISTS "allow_all_update_loyalty_points" ON loyalty_points;

-- 2. Recréer des policies simples et propres
CREATE POLICY "Allow public to read loyalty_points"
  ON loyalty_points
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow service role to manage loyalty_points"
  ON loyalty_points
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to insert loyalty_points"
  ON loyalty_points
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated to update loyalty_points"
  ON loyalty_points
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Forcer le rechargement du cache PostgREST
NOTIFY pgrst, 'reload schema';

-- Message de confirmation
DO $$ 
BEGIN
    RAISE NOTICE '✅ Policies RLS nettoyées et reconstruites sur loyalty_points';
    RAISE NOTICE '✅ Cache PostgREST rechargé';
END $$;
