/*
  # Renommage de la table media_library en media

  ## Modifications
  
  1. **Renommage de la table**
    - Renomme `media_library` en `media` pour plus de simplicité
    - Conserve toutes les colonnes, index, triggers et policies existants
  
  ## Sécurité
    - Les policies RLS existantes sont préservées
    - Aucune perte de données
*/

-- Renommer la table
ALTER TABLE IF EXISTS media_library RENAME TO media;

-- Renommer les index
ALTER INDEX IF EXISTS idx_media_bucket RENAME TO idx_media_bucket_name;
ALTER INDEX IF EXISTS idx_media_filename RENAME TO idx_media_file_name;
ALTER INDEX IF EXISTS idx_media_orphan RENAME TO idx_media_is_orphan;
ALTER INDEX IF EXISTS idx_media_created RENAME TO idx_media_created_at;

-- Renommer le trigger function (optionnel, pour cohérence)
DROP TRIGGER IF EXISTS media_library_updated_at ON media;
CREATE TRIGGER media_updated_at
  BEFORE UPDATE ON media
  FOR EACH ROW
  EXECUTE FUNCTION update_media_updated_at();
