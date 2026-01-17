/*
  # Ajout des champs manquants à la table profiles
  
  1. Modifications
    - Ajout des colonnes manquantes pour la page /account
    - Séparation de full_name en first_name et last_name
    - Ajout des champs : phone, avatar_url, birth_date, is_admin, blocked, etc.
  
  2. Notes importantes
    - Les colonnes existantes sont préservées
    - Migration sûre avec IF NOT EXISTS
*/

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$
BEGIN
  -- Ajouter first_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text DEFAULT '';
  END IF;

  -- Ajouter last_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name text DEFAULT '';
  END IF;

  -- Ajouter phone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text DEFAULT '';
  END IF;

  -- Ajouter avatar_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text DEFAULT '';
  END IF;

  -- Ajouter birth_date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'birth_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN birth_date text;
  END IF;

  -- Ajouter is_admin
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;

  -- Ajouter blocked
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'blocked'
  ) THEN
    ALTER TABLE profiles ADD COLUMN blocked boolean DEFAULT false;
  END IF;

  -- Ajouter blocked_reason
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'blocked_reason'
  ) THEN
    ALTER TABLE profiles ADD COLUMN blocked_reason text;
  END IF;

  -- Ajouter blocked_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'blocked_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN blocked_at timestamptz;
  END IF;

  -- Ajouter cancelled_orders_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cancelled_orders_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cancelled_orders_count integer DEFAULT 0;
  END IF;

  -- Ajouter updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Créer ou remplacer la fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe et le recréer
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();
