/*
  # Fix home_categories Schema

  Aligner la structure de la table avec les données existantes.

  ## Changements
  - Ajout colonnes `name` et `slug` si elles n'existent pas
  - Ajout colonne `sort_order` si elle n'existe pas
  - `category_id` devient optionnel (permet les catégories sans référence)

  ## Notes
  - Conserve toutes les données existantes
  - Les colonnes redondantes (name/category_name, slug/category_slug)
    permettent la compatibilité avec l'ancien et le nouveau code
*/

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$
BEGIN
  -- Ajouter colonne 'name' si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'home_categories' AND column_name = 'name'
  ) THEN
    ALTER TABLE home_categories ADD COLUMN name text;
    -- Copier les valeurs depuis category_name
    UPDATE home_categories SET name = category_name WHERE name IS NULL;
  END IF;

  -- Ajouter colonne 'slug' si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'home_categories' AND column_name = 'slug'
  ) THEN
    ALTER TABLE home_categories ADD COLUMN slug text;
    -- Copier les valeurs depuis category_slug
    UPDATE home_categories SET slug = category_slug WHERE slug IS NULL;
  END IF;

  -- Ajouter colonne 'sort_order' si elle n'existe pas
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'home_categories' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE home_categories ADD COLUMN sort_order integer DEFAULT 0;
    -- Copier les valeurs depuis display_order
    UPDATE home_categories SET sort_order = display_order WHERE sort_order = 0;
  END IF;
END $$;

-- Rendre category_id nullable (certaines catégories peuvent ne pas avoir de référence)
ALTER TABLE home_categories ALTER COLUMN category_id DROP NOT NULL;

-- Créer un trigger pour synchroniser les colonnes redondantes
CREATE OR REPLACE FUNCTION sync_home_categories_fields()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Synchroniser name <-> category_name
  IF NEW.name IS NOT NULL AND NEW.category_name IS NULL THEN
    NEW.category_name := NEW.name;
  ELSIF NEW.category_name IS NOT NULL AND NEW.name IS NULL THEN
    NEW.name := NEW.category_name;
  END IF;

  -- Synchroniser slug <-> category_slug
  IF NEW.slug IS NOT NULL AND NEW.category_slug IS NULL THEN
    NEW.category_slug := NEW.slug;
  ELSIF NEW.category_slug IS NOT NULL AND NEW.slug IS NULL THEN
    NEW.slug := NEW.category_slug;
  END IF;

  -- Synchroniser sort_order <-> display_order
  IF NEW.sort_order IS NOT NULL AND NEW.display_order != NEW.sort_order THEN
    NEW.display_order := NEW.sort_order;
  ELSIF NEW.display_order IS NOT NULL AND NEW.sort_order != NEW.display_order THEN
    NEW.sort_order := NEW.display_order;
  END IF;

  RETURN NEW;
END;
$$;

-- Appliquer le trigger
DROP TRIGGER IF EXISTS sync_home_categories_fields_trigger ON home_categories;
CREATE TRIGGER sync_home_categories_fields_trigger
  BEFORE INSERT OR UPDATE ON home_categories
  FOR EACH ROW
  EXECUTE FUNCTION sync_home_categories_fields();
