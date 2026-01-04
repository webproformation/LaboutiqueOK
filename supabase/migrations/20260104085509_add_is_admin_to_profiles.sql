/*
  # Ajouter colonne is_admin à profiles

  1. Modifications
    - Ajoute la colonne `is_admin` (boolean, default false)
    - Permet de gérer les droits administrateur depuis l'admin

  2. Sécurité
    - Seuls les admins peuvent modifier is_admin
*/

-- Ajouter la colonne is_admin si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;
