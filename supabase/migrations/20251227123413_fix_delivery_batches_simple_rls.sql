/*
  # Correction simple RLS delivery_batches
  
  1. Modifications
    - Recréer les policies sans admin bypass pour l'instant
    - Assurer que auth.uid() fonctionne correctement
    
  2. Sécurité
    - Les utilisateurs authentifiés peuvent voir leurs propres batches
*/

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Users can view own delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Users can insert own delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Users can update own delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Users can delete own delivery batches" ON delivery_batches;

-- Recréer les policies de base
CREATE POLICY "Users can view own delivery batches"
  ON delivery_batches FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own delivery batches"
  ON delivery_batches FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own delivery batches"
  ON delivery_batches FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own delivery batches"
  ON delivery_batches FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
