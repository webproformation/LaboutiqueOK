/*
  # Correction Media Library - Ajout colonnes manquantes (V2)

  ## Problème
  La table `media_library` a été modifiée et utilise maintenant `filename` et `url`
  au lieu de `file_name` et `public_url`, mais il manque des colonnes essentielles
  pour le tracking d'utilisation.

  ## Modifications
  1. Ajout de colonnes manquantes :
     - `usage_count` : Nombre d'utilisations du média
     - `is_orphan` : Indique si le média n'est utilisé nulle part
     - `file_path` : Chemin du fichier dans le storage (pour compatibilité)
     - `used_in_products` : Array des produits utilisant ce média
     - `used_in_categories` : Array des catégories utilisant ce média

  2. Index pour optimisation
  3. Recréation de la vue stats

  ## Sécurité
  - Aucune modification des RLS existantes
  - Ajout de colonnes avec valeurs par défaut sûres
*/

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$
BEGIN
  -- usage_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'media_library'
      AND column_name = 'usage_count'
  ) THEN
    ALTER TABLE media_library
    ADD COLUMN usage_count INTEGER DEFAULT 0;
  END IF;

  -- is_orphan
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'media_library'
      AND column_name = 'is_orphan'
  ) THEN
    ALTER TABLE media_library
    ADD COLUMN is_orphan BOOLEAN DEFAULT true;
  END IF;

  -- file_path (pour compatibilité)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'media_library'
      AND column_name = 'file_path'
  ) THEN
    ALTER TABLE media_library
    ADD COLUMN file_path TEXT;
  END IF;

  -- used_in_products
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'media_library'
      AND column_name = 'used_in_products'
  ) THEN
    ALTER TABLE media_library
    ADD COLUMN used_in_products INTEGER[] DEFAULT '{}';
  END IF;

  -- used_in_categories
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'media_library'
      AND column_name = 'used_in_categories'
  ) THEN
    ALTER TABLE media_library
    ADD COLUMN used_in_categories INTEGER[] DEFAULT '{}';
  END IF;

  -- uploaded_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'media_library'
      AND column_name = 'uploaded_by'
  ) THEN
    ALTER TABLE media_library
    ADD COLUMN uploaded_by UUID REFERENCES auth.users(id);
  END IF;

  -- updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'media_library'
      AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE media_library
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Créer les index si ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_media_filename ON media_library(filename);
CREATE INDEX IF NOT EXISTS idx_media_orphan ON media_library(is_orphan);
CREATE INDEX IF NOT EXISTS idx_media_usage ON media_library(usage_count);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS media_library_updated_at ON media_library;
CREATE TRIGGER media_library_updated_at
  BEFORE UPDATE ON media_library
  FOR EACH ROW
  EXECUTE FUNCTION update_media_updated_at();

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
  -- Trouver le média par URL
  SELECT id, used_in_products, used_in_categories
  INTO v_media_id, v_current_products, v_current_categories
  FROM media_library
  WHERE url = p_media_url
  LIMIT 1;

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
      usage_count = COALESCE(array_length(v_current_products, 1), 0) + COALESCE(array_length(v_current_categories, 1), 0),
      is_orphan = (COALESCE(array_length(v_current_products, 1), 0) + COALESCE(array_length(v_current_categories, 1), 0)) = 0
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
      usage_count = COALESCE(array_length(v_current_products, 1), 0) + COALESCE(array_length(v_current_categories, 1), 0),
      is_orphan = (COALESCE(array_length(v_current_products, 1), 0) + COALESCE(array_length(v_current_categories, 1), 0)) = 0
    WHERE id = v_media_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer la vue stats
DROP VIEW IF EXISTS media_library_stats;
CREATE VIEW media_library_stats AS
SELECT
  bucket_name,
  COUNT(*) as total_files,
  SUM(COALESCE(file_size, 0)) as total_size,
  COUNT(*) FILTER (WHERE is_orphan = true) as orphan_count,
  AVG(COALESCE(usage_count, 0)) as avg_usage
FROM media_library
GROUP BY bucket_name;

-- Permissions sur la vue
GRANT SELECT ON media_library_stats TO authenticated, anon;

-- Notification pour forcer le reload du cache PostgREST
NOTIFY pgrst, 'reload schema';
