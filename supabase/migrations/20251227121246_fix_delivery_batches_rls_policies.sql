/*
  # Correction des policies RLS pour delivery_batches

  1. Modifications
    - Supprimer la policy anon problématique qui bloque tout
    - Supprimer les policies dupliquées
    - Créer des policies propres et claires
    
  2. Sécurité
    - Les utilisateurs authentifiés peuvent voir leurs propres batches
    - Pas d'accès anonyme (sauf si explicitement nécessaire)
*/

-- Supprimer toutes les policies existantes
DROP POLICY IF EXISTS "Anonymous access delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Users can view their own delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Users view own delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Users can create their own delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Users can update their own delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Users can delete their own delivery batches" ON delivery_batches;

-- Créer des policies propres
CREATE POLICY "Users can view own delivery batches"
  ON delivery_batches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own delivery batches"
  ON delivery_batches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own delivery batches"
  ON delivery_batches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own delivery batches"
  ON delivery_batches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
