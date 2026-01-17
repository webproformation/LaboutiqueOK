/*
  # Nettoyage des politiques RLS temporaires et insécurisées

  ## Problème
  Plusieurs politiques RLS utilisent `USING (true)` ou `WITH CHECK (true)` ce qui est non sécurisé.
  Ces politiques ont été créées temporairement pour le diagnostic et doivent être remplacées.

  ## Tables concernées
  - `home_categories` : Politique temporaire de diagnostic à supprimer
  - `news_posts` : Politique "FOR ALL" trop permissive à sécuriser
  - `news_categories` : Politique "FOR ALL" trop permissive à sécuriser
  - `news_post_categories` : Politique SELECT publique à restreindre

  ## Solution
  - Supprimer toutes les politiques temporaires et insécurisées
  - Recréer des politiques RLS restrictives basées sur le rôle admin
  - Maintenir l'accès public en lecture pour le contenu publié

  ## Sécurité
  - RLS reste activé sur toutes les tables
  - Public (anon) : Lecture du contenu publié uniquement
  - Authentifiés non-admin : Lecture du contenu publié uniquement
  - Admin uniquement : Gestion complète (INSERT, UPDATE, DELETE)
*/

-- ============================================================================
-- CLEANUP: home_categories
-- ============================================================================

-- Supprimer la politique temporaire de diagnostic (non sécurisée)
DROP POLICY IF EXISTS "TEMP - All authenticated can view home categories" ON home_categories;

-- ============================================================================
-- CLEANUP: news_posts
-- ============================================================================

-- Supprimer l'ancienne politique trop permissive
DROP POLICY IF EXISTS "Authenticated users can manage posts" ON news_posts;

-- Créer des politiques séparées et sécurisées pour news_posts
CREATE POLICY "Admins can insert news posts"
  ON news_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update news posts"
  ON news_posts FOR UPDATE
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

CREATE POLICY "Admins can delete news posts"
  ON news_posts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Ajouter une politique SELECT pour les admins qui voient tout
CREATE POLICY "Admins can view all news posts"
  ON news_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- CLEANUP: news_categories
-- ============================================================================

-- Supprimer l'ancienne politique trop permissive
DROP POLICY IF EXISTS "Authenticated users can manage news categories" ON news_categories;

-- Créer des politiques séparées et sécurisées pour news_categories
CREATE POLICY "Admins can insert news categories"
  ON news_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update news categories"
  ON news_categories FOR UPDATE
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

CREATE POLICY "Admins can delete news categories"
  ON news_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Ajouter une politique SELECT pour les admins qui voient tout
CREATE POLICY "Admins can view all news categories"
  ON news_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ============================================================================
-- CLEANUP: news_post_categories
-- ============================================================================

-- Supprimer l'ancienne politique trop permissive
DROP POLICY IF EXISTS "Anyone can view post categories" ON news_post_categories;

-- Recréer la politique SELECT de manière appropriée (public peut voir les liaisons des posts publiés)
CREATE POLICY "Anyone can view published post categories"
  ON news_post_categories FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM news_posts
      WHERE news_posts.id = news_post_categories.post_id
      AND news_posts.status = 'publish'
      AND news_posts.published_at <= now()
    )
  );

-- Admins peuvent voir toutes les liaisons
CREATE POLICY "Admins can view all post categories"
  ON news_post_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins peuvent gérer les liaisons
CREATE POLICY "Admins can manage post categories"
  ON news_post_categories FOR ALL
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
