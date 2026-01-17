/*
  # Création du système de gestion SEO des pages

  ## Description
  Ce système permet de gérer le référencement SEO de toutes les pages du site
  (hors pages catégories et admin). Il inclut la gestion du contenu avec éditeur
  WYSIWYG et toutes les métadonnées SEO.

  ## Tables créées
  
  ### `pages_seo`
  Contient toutes les pages gérables avec leur contenu et métadonnées SEO
  - `id` (text, primary key) - Identifiant unique de la page
  - `slug` (text, unique) - URL slug de la page (ex: "qui-sommes-nous")
  - `title` (text) - Titre de la page
  - `content` (text) - Contenu HTML de la page (éditeur WYSIWYG)
  - `is_published` (boolean) - Statut de publication
  - `page_type` (text) - Type de page (home, static, custom)
  
  ### Métadonnées SEO
  - `meta_title` (text) - Titre SEO (max 60 caractères recommandé)
  - `meta_description` (text) - Description SEO (max 160 caractères recommandé)
  - `meta_keywords` (text) - Mots-clés SEO
  - `og_title` (text) - Open Graph titre
  - `og_description` (text) - Open Graph description
  - `og_image` (text) - Open Graph image URL
  - `canonical_url` (text) - URL canonique
  - `robots_index` (boolean) - Autoriser indexation moteurs
  - `robots_follow` (boolean) - Autoriser suivi des liens
  
  ### Métadonnées système
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Date de dernière modification
  - `created_by` (uuid) - Utilisateur créateur (référence profiles)
  - `updated_by` (uuid) - Utilisateur dernière modification

  ## Sécurité
  - RLS activé sur la table
  - Les utilisateurs anonymes peuvent lire les pages publiées
  - Seuls les admins peuvent créer/modifier/supprimer les pages
*/

-- Création de la table pages_seo
CREATE TABLE IF NOT EXISTS pages_seo (
  id text PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  content text DEFAULT '',
  is_published boolean DEFAULT false,
  page_type text DEFAULT 'static' CHECK (page_type IN ('home', 'static', 'custom')),
  
  -- Métadonnées SEO
  meta_title text,
  meta_description text,
  meta_keywords text,
  og_title text,
  og_description text,
  og_image text,
  canonical_url text,
  robots_index boolean DEFAULT true,
  robots_follow boolean DEFAULT true,
  
  -- Métadonnées système
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_pages_seo_slug ON pages_seo(slug);
CREATE INDEX IF NOT EXISTS idx_pages_seo_published ON pages_seo(is_published);
CREATE INDEX IF NOT EXISTS idx_pages_seo_page_type ON pages_seo(page_type);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_pages_seo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_pages_seo_updated_at ON pages_seo;
CREATE TRIGGER trigger_update_pages_seo_updated_at
  BEFORE UPDATE ON pages_seo
  FOR EACH ROW
  EXECUTE FUNCTION update_pages_seo_updated_at();

-- Activation de RLS
ALTER TABLE pages_seo ENABLE ROW LEVEL SECURITY;

-- Politique : Les utilisateurs anonymes peuvent lire les pages publiées
CREATE POLICY "Anonymous users can view published pages"
  ON pages_seo
  FOR SELECT
  USING (is_published = true);

-- Politique : Les utilisateurs authentifiés peuvent lire toutes les pages
CREATE POLICY "Authenticated users can view all pages"
  ON pages_seo
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique : Seuls les admins peuvent créer des pages
CREATE POLICY "Only admins can create pages"
  ON pages_seo
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Politique : Seuls les admins peuvent modifier des pages
CREATE POLICY "Only admins can update pages"
  ON pages_seo
  FOR UPDATE
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

-- Politique : Seuls les admins peuvent supprimer des pages
CREATE POLICY "Only admins can delete pages"
  ON pages_seo
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Insertion de la page d'accueil par défaut
INSERT INTO pages_seo (
  id,
  slug,
  title,
  content,
  is_published,
  page_type,
  meta_title,
  meta_description,
  robots_index,
  robots_follow
) VALUES (
  'home-page',
  'home',
  'Accueil - La Boutique de Morgane',
  '<h1>Bienvenue sur La Boutique de Morgane</h1><p>Découvrez nos collections exclusives.</p>',
  true,
  'home',
  'La Boutique de Morgane - Bijoux et Accessoires',
  'Découvrez La Boutique de Morgane : bijoux, accessoires et mode tendance. Livraison rapide et service client exceptionnel.',
  true,
  true
)
ON CONFLICT (slug) DO NOTHING;