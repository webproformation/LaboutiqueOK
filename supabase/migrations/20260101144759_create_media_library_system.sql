/*
  # Système de Médiathèque Supabase

  1. Nouvelles tables
    - `media_library`
      - Index de tous les médias stockés dans Supabase Storage
      - Suivi de l'utilisation (products, categories, etc.)
      - Métadonnées optimisées (taille, format, dimensions)

  2. Sécurité
    - RLS activé avec politiques pour admins
    - Lecture publique pour les médias actifs

  3. Fonctions
    - Fonction pour marquer les médias orphelins
    - Fonction pour nettoyer les médias non utilisés
*/

-- Table pour indexer tous les médias
CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  bucket_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  is_optimized BOOLEAN DEFAULT false,
  original_wordpress_url TEXT,
  used_in_products INTEGER[] DEFAULT '{}',
  used_in_categories INTEGER[] DEFAULT '{}',
  usage_count INTEGER DEFAULT 0,
  is_orphan BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour recherches optimisées
CREATE INDEX IF NOT EXISTS idx_media_bucket ON media_library(bucket_name);
CREATE INDEX IF NOT EXISTS idx_media_file_name ON media_library(file_name);
CREATE INDEX IF NOT EXISTS idx_media_orphan ON media_library(is_orphan);
CREATE INDEX IF NOT EXISTS idx_media_mime_type ON media_library(mime_type);
CREATE INDEX IF NOT EXISTS idx_media_created ON media_library(created_at DESC);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_library_updated_at
  BEFORE UPDATE ON media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_media_updated_at();

-- RLS
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour tous
CREATE POLICY "Anyone can read media library"
  ON media_library
  FOR SELECT
  USING (true);

-- Admins peuvent tout faire
CREATE POLICY "Admins can insert media"
  ON media_library
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update media"
  ON media_library
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete media"
  ON media_library
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Fonction pour détecter les médias orphelins
CREATE OR REPLACE FUNCTION mark_orphan_media()
RETURNS void AS $$
BEGIN
  UPDATE media_library
  SET
    is_orphan = true,
    usage_count = 0
  WHERE
    usage_count = 0
    AND array_length(used_in_products, 1) IS NULL
    AND array_length(used_in_categories, 1) IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour l'utilisation d'un média
CREATE OR REPLACE FUNCTION update_media_usage(
  p_media_url TEXT,
  p_entity_type TEXT,
  p_entity_id INTEGER,
  p_action TEXT DEFAULT 'add'
)
RETURNS void AS $$
DECLARE
  v_media_id UUID;
  v_current_products INTEGER[];
  v_current_categories INTEGER[];
BEGIN
  -- Trouver le média
  SELECT id, used_in_products, used_in_categories
  INTO v_media_id, v_current_products, v_current_categories
  FROM media_library
  WHERE public_url = p_media_url;

  IF v_media_id IS NULL THEN
    RETURN;
  END IF;

  -- Mettre à jour selon le type
  IF p_entity_type = 'product' THEN
    IF p_action = 'add' THEN
      v_current_products := array_append(v_current_products, p_entity_id);
    ELSE
      v_current_products := array_remove(v_current_products, p_entity_id);
    END IF;

    UPDATE media_library
    SET
      used_in_products = v_current_products,
      usage_count = array_length(v_current_products, 1) + array_length(v_current_categories, 1),
      is_orphan = (array_length(v_current_products, 1) + array_length(v_current_categories, 1)) = 0
    WHERE id = v_media_id;

  ELSIF p_entity_type = 'category' THEN
    IF p_action = 'add' THEN
      v_current_categories := array_append(v_current_categories, p_entity_id);
    ELSE
      v_current_categories := array_remove(v_current_categories, p_entity_id);
    END IF;

    UPDATE media_library
    SET
      used_in_categories = v_current_categories,
      usage_count = array_length(v_current_products, 1) + array_length(v_current_categories, 1),
      is_orphan = (array_length(v_current_products, 1) + array_length(v_current_categories, 1)) = 0
    WHERE id = v_media_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour nettoyer les médias orphelins (avec confirmation)
CREATE OR REPLACE FUNCTION cleanup_orphan_media(
  p_days_old INTEGER DEFAULT 30
)
RETURNS TABLE (
  deleted_count INTEGER,
  deleted_media JSONB
) AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_deleted_media JSONB;
BEGIN
  WITH deleted AS (
    DELETE FROM media_library
    WHERE
      is_orphan = true
      AND created_at < now() - (p_days_old || ' days')::INTERVAL
    RETURNING *
  )
  SELECT COUNT(*), jsonb_agg(to_jsonb(deleted))
  INTO v_deleted_count, v_deleted_media
  FROM deleted;

  RETURN QUERY SELECT v_deleted_count, v_deleted_media;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue pour statistiques médias
CREATE OR REPLACE VIEW media_library_stats AS
SELECT
  bucket_name,
  COUNT(*) as total_files,
  SUM(file_size) as total_size,
  COUNT(*) FILTER (WHERE is_orphan = true) as orphan_count,
  COUNT(*) FILTER (WHERE is_optimized = true) as optimized_count,
  AVG(usage_count) as avg_usage
FROM media_library
GROUP BY bucket_name;

-- Permissions sur la vue
GRANT SELECT ON media_library_stats TO authenticated, anon;
