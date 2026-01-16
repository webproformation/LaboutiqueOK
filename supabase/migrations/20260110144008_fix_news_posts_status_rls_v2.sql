/*
  # Correction RLS - Accès anonyme aux actualités (v2)

  1. Objectif
    - Le code frontend utilise status = 'publish' (pas 'published')
    - Corriger la policy pour correspondre au code

  2. Modifications
    - Mise à jour de la policy pour status = 'publish'
    
  3. Sécurité
    - Accès lecture uniquement pour anonymous
*/

-- Supprimer anciennes policies
DROP POLICY IF EXISTS "Anyone can view published news" ON news_posts;

-- Policy pour lecture anonyme des news publiées (avec status 'publish')
CREATE POLICY "Anyone can view published news"
  ON news_posts FOR SELECT
  TO anon, authenticated
  USING (status = 'publish' AND published_at IS NOT NULL AND published_at <= now());
