/*
  # Correction RLS - Accès anonyme aux actualités

  1. Objectif
    - Permettre aux utilisateurs non connectés de consulter les actualités publiées
    - Maintenir la restriction admin pour la gestion

  2. Modifications
    - Ajouter policy SELECT pour anonymous sur table news_posts
    - Permettre la lecture des news avec status 'published'
    
  3. Sécurité
    - Accès lecture uniquement pour anonymous
    - Gestion complète réservée aux admins
*/

-- Supprimer anciennes policies si existantes
DROP POLICY IF EXISTS "Anyone can view published news_posts" ON news_posts;
DROP POLICY IF EXISTS "Anyone can view published news" ON news_posts;

-- Policy pour lecture anonyme des news publiées
CREATE POLICY "Anyone can view published news"
  ON news_posts FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND published_at IS NOT NULL);

-- Policy admin existante devrait déjà permettre la gestion complète
-- Mais on la recrée pour être sûr
DROP POLICY IF EXISTS "Admins can manage all news_posts" ON news_posts;

CREATE POLICY "Admins can manage all news_posts"
  ON news_posts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
