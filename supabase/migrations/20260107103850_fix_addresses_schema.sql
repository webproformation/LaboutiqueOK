/*
  # Correction du schéma de la table addresses

  1. Problème Identifié
    - Le code attend les colonnes `address_type` et `street`
    - La table a `label` et `address_line1` à la place
    - Décalage entre code et structure de base

  2. Changements
    - Ajout de la colonne `address_type` (alias de `label`)
    - Ajout de la colonne `street` (alias de `address_line1`)
    - Conservation des colonnes existantes pour compatibilité
    - Conversion de `id` de UUID vers TEXT

  3. Sécurité
    - Utilisation de IF NOT EXISTS
    - Préservation des données existantes
    - Maintien des RLS policies
*/

-- Ajouter la colonne address_type si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'addresses' AND column_name = 'address_type'
  ) THEN
    ALTER TABLE addresses ADD COLUMN address_type TEXT DEFAULT 'shipping';
    
    -- Copier les données de label vers address_type si label existe
    UPDATE addresses SET address_type = COALESCE(label, 'shipping');
  END IF;
END $$;

-- Ajouter la colonne street si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'addresses' AND column_name = 'street'
  ) THEN
    ALTER TABLE addresses ADD COLUMN street TEXT;
    
    -- Copier les données de address_line1 vers street
    UPDATE addresses SET street = address_line1;
    
    -- Rendre la colonne NOT NULL après la copie
    ALTER TABLE addresses ALTER COLUMN street SET NOT NULL;
  END IF;
END $$;

-- Conversion de addresses.id de UUID vers TEXT
DO $$
BEGIN
  -- Vérifier si la colonne id est de type UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'addresses' 
    AND column_name = 'id' 
    AND data_type = 'uuid'
  ) THEN
    -- Créer une colonne temporaire
    ALTER TABLE addresses ADD COLUMN id_temp TEXT;
    
    -- Copier les données existantes
    UPDATE addresses SET id_temp = id::TEXT;
    
    -- Supprimer l'ancienne colonne et renommer
    ALTER TABLE addresses DROP COLUMN id CASCADE;
    ALTER TABLE addresses RENAME COLUMN id_temp TO id;
    
    -- Ajouter la contrainte de clé primaire
    ALTER TABLE addresses ADD PRIMARY KEY (id);
    
    -- Ajouter une valeur par défaut
    ALTER TABLE addresses ALTER COLUMN id SET DEFAULT 'addr_' || substr(md5(random()::text), 1, 16);
  END IF;
END $$;
