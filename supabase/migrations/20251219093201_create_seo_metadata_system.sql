/*
  # Système de métadonnées SEO

  Ce système permet de gérer les métadonnées SEO pour :
  - Pages statiques (pages du site)
  - Catégories de produits (WooCommerce)
  - Articles (actualités/blog)

  1. Nouvelle table
    - `seo_metadata`
      - `id` (uuid, primary key)
      - `entity_type` (text) - Type d'entité : 'page', 'category', 'post'
      - `entity_identifier` (text) - Identifiant de l'entité (slug, ID, etc.)
      - `seo_title` (text) - Titre SEO optimisé
      - `meta_description` (text) - Description meta
      - `meta_keywords` (text) - Mots-clés meta
      - `og_title` (text) - Titre Open Graph
      - `og_description` (text) - Description Open Graph
      - `og_image` (text) - Image Open Graph (URL)
      - `canonical_url` (text) - URL canonique
      - `robots_meta` (text) - Directives robots (index, follow, etc.)
      - `schema_markup` (jsonb) - Données structurées Schema.org
      - `is_active` (boolean) - Si les métadonnées sont actives
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `seo_metadata` table
    - Anyone can read active SEO metadata
    - Only admins can manage SEO metadata
*/

-- Create SEO metadata table
CREATE TABLE IF NOT EXISTS seo_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('page', 'category', 'post')),
  entity_identifier text NOT NULL,
  seo_title text,
  meta_description text,
  meta_keywords text,
  og_title text,
  og_description text,
  og_image text,
  canonical_url text,
  robots_meta text DEFAULT 'index, follow',
  schema_markup jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_identifier)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_seo_metadata_entity ON seo_metadata(entity_type, entity_identifier) WHERE is_active = true;

-- Enable RLS
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;

-- Public can read active SEO metadata
CREATE POLICY "Anyone can read active SEO metadata"
  ON seo_metadata FOR SELECT
  USING (is_active = true);

-- Admins can manage all SEO metadata
CREATE POLICY "Admins can insert SEO metadata"
  ON seo_metadata FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update SEO metadata"
  ON seo_metadata FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete SEO metadata"
  ON seo_metadata FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_seo_metadata_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS seo_metadata_updated_at ON seo_metadata;
CREATE TRIGGER seo_metadata_updated_at
  BEFORE UPDATE ON seo_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_metadata_timestamp();

-- Insert default SEO metadata for key pages
INSERT INTO seo_metadata (entity_type, entity_identifier, seo_title, meta_description, meta_keywords, og_title, og_description, robots_meta) VALUES
  ('page', 'home', 'La Boutique de Morgane | Live Shopping Mode & Beauté', 'Découvre La Boutique de Morgane : shopping en live, mode tendance, beauté et lifestyle. Participe aux lives interactifs et profite d''offres exclusives !', 'live shopping, mode femme, boutique en ligne, shopping interactif, La Boutique de Morgane', 'La Boutique de Morgane - Live Shopping Mode & Beauté', 'Découvre ma boutique en ligne avec lives interactifs, mode tendance et beauté. Rejoins-moi pour des sessions shopping uniques !', 'index, follow'),

  ('page', 'actualites', 'Le Carnet de Morgane | Conseils Mode, Beauté et Maison', 'Plonge dans le Carnet de Morgane : conseils mode, beauté, lifestyle et astuces maison. Mon coin des confidences où je partage mes coups de cœur et mes découvertes du moment.', 'blog mode, conseils beauté, lifestyle, Le Carnet de Morgane, astuces mode', 'Le Carnet de Morgane - Conseils & Confidences Mode', 'Le coin des confidences, de la mode et du lifestyle. Découvre mes conseils, astuces et coups de cœur !', 'index, follow'),

  ('page', 'live', 'Lives Shopping & Replays | La Boutique de Morgane', 'Rejoins mes lives shopping en direct ! Découvre mes nouveautés en exclusivité, pose tes questions et profite d''offres spéciales pendant les sessions.', 'live shopping, streaming shopping, shopping en direct, lives mode', 'Lives Shopping en Direct - La Boutique de Morgane', 'Participe à mes lives shopping interactifs et découvre mes coups de cœur en exclusivité !', 'index, follow'),

  ('page', 'promos', 'Promotions & Bons Plans Mode | La Boutique de Morgane', 'Découvre toutes mes promotions et bons plans mode ! Profite de réductions exclusives sur une sélection de pièces tendance renouvelée chaque semaine.', 'promotions mode, soldes, bons plans, réductions vêtements', 'Promotions & Offres Exclusives - La Boutique de Morgane', 'Ne rate pas mes promotions et offres spéciales sur la mode et les accessoires !', 'index, follow'),

  ('page', 'en-rayon', 'Nouveautés En Rayon | La Boutique de Morgane', 'Découvre mes dernières nouveautés tout juste arrivées en rayon ! Mode tendance, pièces coup de cœur et exclusivités renouvelées chaque semaine.', 'nouveautés mode, nouvelles collections, arrivages, mode femme', 'Nouveautés Mode En Rayon - La Boutique de Morgane', 'Explore mes derniers arrivages et coups de cœur fraîchement déballés !', 'index, follow'),

  ('page', 'qui-sommes-nous', 'Qui suis-je ? | La Boutique de Morgane', 'Fais connaissance avec Morgane ! Découvre l''histoire de ma boutique, ma passion pour la mode et mon approche unique du shopping en live.', 'Morgane, boutique mode, histoire, à propos', 'À Propos de Morgane - La Boutique de Morgane', 'Découvre qui je suis, ma passion pour la mode et l''histoire de ma boutique !', 'index, follow'),

  ('page', 'contact', 'Contact & Service Client | La Boutique de Morgane', 'Une question ? Besoin d''aide ? Contacte-moi via le formulaire ou sur les réseaux sociaux. Je réponds rapidement à toutes tes demandes !', 'contact, service client, aide, support', 'Contacte-moi - La Boutique de Morgane', 'Des questions ? Je suis là pour t''aider ! Contacte-moi facilement.', 'index, follow')
ON CONFLICT (entity_type, entity_identifier) DO NOTHING;
