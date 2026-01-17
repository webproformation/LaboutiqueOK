/*
  # Système d'actualités "Le Carnet de Morgane"
  
  1. Nouvelles tables
    - `news_categories` : Catégories d'actualités avec hiérarchie
    - `news_posts` : Articles/actualités
    - `news_post_categories` : Liaison N-N entre posts et catégories
  
  2. Sécurité
    - RLS activé sur toutes les tables
    - Policies pour lecture publique des contenus publiés
    - Policies pour gestion admin
*/

-- Table des catégories d'actualités
CREATE TABLE IF NOT EXISTS news_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  parent_id uuid REFERENCES news_categories(id) ON DELETE SET NULL,
  count integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  color text DEFAULT '#b8933d',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_news_categories_slug ON news_categories(slug);
CREATE INDEX IF NOT EXISTS idx_news_categories_active ON news_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_news_categories_parent_id ON news_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_news_categories_display_order ON news_categories(display_order);

ALTER TABLE news_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active news categories"
  ON news_categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage news categories"
  ON news_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Table des articles/actualités
CREATE TABLE IF NOT EXISTS news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text,
  excerpt text,
  featured_image_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'publish', 'pending')),
  published_at timestamptz,
  author_id uuid REFERENCES auth.users(id),
  seo_title text,
  meta_description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_news_posts_slug ON news_posts(slug);
CREATE INDEX IF NOT EXISTS idx_news_posts_status ON news_posts(status);
CREATE INDEX IF NOT EXISTS idx_news_posts_published_at ON news_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_news_posts_author ON news_posts(author_id);

ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published posts"
  ON news_posts FOR SELECT
  TO anon, authenticated
  USING (status = 'publish' AND published_at <= now());

CREATE POLICY "Authenticated users can manage posts"
  ON news_posts FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Table de liaison posts <-> catégories
CREATE TABLE IF NOT EXISTS news_post_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES news_posts(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES news_categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(post_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_news_post_categories_post ON news_post_categories(post_id);
CREATE INDEX IF NOT EXISTS idx_news_post_categories_category ON news_post_categories(category_id);

ALTER TABLE news_post_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view post categories"
  ON news_post_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage post categories"
  ON news_post_categories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger pour updated_at sur news_categories
CREATE OR REPLACE FUNCTION update_news_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS news_categories_updated_at ON news_categories;
CREATE TRIGGER news_categories_updated_at
  BEFORE UPDATE ON news_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_news_categories_updated_at();

-- Trigger pour updated_at sur news_posts
CREATE OR REPLACE FUNCTION update_news_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS news_posts_updated_at ON news_posts;
CREATE TRIGGER news_posts_updated_at
  BEFORE UPDATE ON news_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_news_posts_updated_at();

-- Insérer quelques catégories par défaut
INSERT INTO news_categories (name, slug, description, color, display_order) VALUES
  ('Mode & Style', 'mode-style', 'Tendances mode, looks et conseils style', '#F8B4C1', 1),
  ('Lifestyle', 'lifestyle', 'Vie quotidienne, bien-être et inspiration', '#C6A15B', 2),
  ('Beauté', 'beaute', 'Astuces beauté, soins et maquillage', '#E8A5C0', 3),
  ('Voyages', 'voyages', 'Découvertes et carnets de voyage', '#A0C4D4', 4)
ON CONFLICT (slug) DO NOTHING;
