/*
  # Ajout configuration menu principal pour catégories

  1. Nouvelle colonne
    - `show_in_main_menu` (boolean) : Détermine si la catégorie apparaît dans le menu principal

  2. Mise à jour
    - Définir les catégories principales existantes comme visibles par défaut

  3. Index
    - Index sur show_in_main_menu pour requêtes rapides du menu

  4. Sécurité
    - Les politiques RLS existantes s'appliquent automatiquement
*/

-- ============================================
-- 1. AJOUT COLONNE show_in_main_menu
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'show_in_main_menu'
  ) THEN
    ALTER TABLE categories
      ADD COLUMN show_in_main_menu BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Index pour améliorer les performances de requête du menu
CREATE INDEX IF NOT EXISTS idx_categories_show_in_main_menu
  ON categories(show_in_main_menu)
  WHERE show_in_main_menu = true;

-- ============================================
-- 2. ACTIVATION PAR DÉFAUT DES CATÉGORIES PRINCIPALES
-- ============================================

-- Activer les catégories de niveau 0 qui n'ont pas de parent
UPDATE categories
SET show_in_main_menu = true
WHERE parent_id IS NULL
  AND is_visible = true;

-- ============================================
-- 3. COMMENTAIRE SUR LA COLONNE
-- ============================================

COMMENT ON COLUMN categories.show_in_main_menu IS
  'Indique si la catégorie doit apparaître dans le menu de navigation principal (bandeau noir). Les catégories de niveau 0 avec cette option activée déclencheront l''affichage du méga-menu si elles ont des sous-catégories.';
