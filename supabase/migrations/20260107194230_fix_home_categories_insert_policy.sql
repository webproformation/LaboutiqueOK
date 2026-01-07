/*
  # Fix home_categories RLS policies for INSERT

  ## Problème
  La politique "FOR ALL" peut bloquer les INSERT même pour les admins authentifiés.

  ## Solution
  - Supprimer la politique "FOR ALL"
  - Créer des politiques séparées pour INSERT, UPDATE et DELETE
  - Chaque politique vérifie explicitement que l'utilisateur est admin

  ## Sécurité
  - RLS reste activé
  - Public : SELECT sur catégories actives uniquement
  - Admin : SELECT sur toutes les catégories
  - Admin : INSERT, UPDATE, DELETE sur toutes les catégories
*/

-- Supprimer l'ancienne politique "FOR ALL" qui bloque les INSERT
DROP POLICY IF EXISTS "Admins can manage home categories" ON home_categories;

-- Créer une politique séparée pour INSERT
CREATE POLICY "Admins can insert home categories"
  ON home_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Créer une politique séparée pour UPDATE
CREATE POLICY "Admins can update home categories"
  ON home_categories FOR UPDATE
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

-- Créer une politique séparée pour DELETE
CREATE POLICY "Admins can delete home categories"
  ON home_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );