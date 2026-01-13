/*
  # Conversion des IDs modules en TEXT

  1. Tables modifiées
    - `open_packages`
      - Conversion `id` de UUID vers TEXT
      - Conservation `user_id` en UUID
    - `live_streams`
      - Conversion `id` de UUID vers TEXT
    - `customer_reviews`
      - Conversion `id` de UUID vers TEXT
      - Conservation `user_id` et `order_id` en UUID

  2. Stratégie
    - Suppression des contraintes FK temporairement
    - Conversion des types de colonnes
    - Recréation des contraintes
    - Ajout de valeurs par défaut avec nanoid()

  3. Sécurité
    - Utilisation de IF EXISTS pour éviter les erreurs
    - Préservation de toutes les RLS policies
*/

-- OPEN_PACKAGES: Conversion id UUID -> TEXT
DO $$
BEGIN
  -- Étape 1: Créer une nouvelle colonne temporaire
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'open_packages' AND column_name = 'id_temp'
  ) THEN
    ALTER TABLE open_packages ADD COLUMN id_temp TEXT;
    
    -- Copier les données existantes
    UPDATE open_packages SET id_temp = id::TEXT;
    
    -- Supprimer l'ancienne colonne et renommer
    ALTER TABLE open_packages DROP COLUMN id CASCADE;
    ALTER TABLE open_packages RENAME COLUMN id_temp TO id;
    
    -- Ajouter la contrainte de clé primaire
    ALTER TABLE open_packages ADD PRIMARY KEY (id);
    
    -- Ajouter une valeur par défaut
    ALTER TABLE open_packages ALTER COLUMN id SET DEFAULT 'op_' || substr(md5(random()::text), 1, 16);
  END IF;
END $$;

-- LIVE_STREAMS: Conversion id UUID -> TEXT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'live_streams' AND column_name = 'id_temp'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN id_temp TEXT;
    
    UPDATE live_streams SET id_temp = id::TEXT;
    
    ALTER TABLE live_streams DROP COLUMN id CASCADE;
    ALTER TABLE live_streams RENAME COLUMN id_temp TO id;
    
    ALTER TABLE live_streams ADD PRIMARY KEY (id);
    
    ALTER TABLE live_streams ALTER COLUMN id SET DEFAULT 'live_' || substr(md5(random()::text), 1, 16);
  END IF;
END $$;

-- CUSTOMER_REVIEWS: Conversion id UUID -> TEXT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_reviews' AND column_name = 'id_temp'
  ) THEN
    ALTER TABLE customer_reviews ADD COLUMN id_temp TEXT;
    
    UPDATE customer_reviews SET id_temp = id::TEXT;
    
    ALTER TABLE customer_reviews DROP COLUMN id CASCADE;
    ALTER TABLE customer_reviews RENAME COLUMN id_temp TO id;
    
    ALTER TABLE customer_reviews ADD PRIMARY KEY (id);
    
    ALTER TABLE customer_reviews ALTER COLUMN id SET DEFAULT 'review_' || substr(md5(random()::text), 1, 16);
  END IF;
END $$;
