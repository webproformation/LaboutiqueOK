/*
  # Correction des Foreign Keys pour Pointer vers Profiles
  
  1. Problème
    - Les tables return_requests, open_packages référencent auth.users(id)
    - Supabase PostgREST ne peut pas suivre automatiquement la relation vers profiles
    - Causes des erreurs 400/PGRST200 lors des jointures
    
  2. Solution
    - Modifier les FK pour pointer directement vers profiles.id
    - profiles.id = auth.users.id donc la relation est 1:1
    
  3. Tables affectées
    - return_requests.user_id
    - open_packages.user_id
    - customer_wallet.user_id (bonus)
    
  4. Sécurité
    - RLS maintenu sur toutes les tables
    - ON DELETE CASCADE préservé
*/

-- 1. return_requests.user_id -> profiles.id
DO $$
BEGIN
  -- Supprimer l'ancienne FK vers auth.users
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'return_requests_user_id_fkey'
      AND table_name = 'return_requests'
  ) THEN
    ALTER TABLE return_requests DROP CONSTRAINT return_requests_user_id_fkey;
  END IF;
  
  -- Créer la nouvelle FK vers profiles
  ALTER TABLE return_requests
    ADD CONSTRAINT return_requests_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
    
  RAISE NOTICE 'return_requests.user_id -> profiles.id';
END $$;

-- 2. open_packages.user_id -> profiles.id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'open_packages_user_id_fkey'
      AND table_name = 'open_packages'
  ) THEN
    ALTER TABLE open_packages DROP CONSTRAINT open_packages_user_id_fkey;
  END IF;
  
  ALTER TABLE open_packages
    ADD CONSTRAINT open_packages_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
    
  RAISE NOTICE 'open_packages.user_id -> profiles.id';
END $$;

-- 3. customer_wallet.user_id -> profiles.id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'customer_wallet_user_id_fkey'
      AND table_name = 'customer_wallet'
  ) THEN
    ALTER TABLE customer_wallet DROP CONSTRAINT customer_wallet_user_id_fkey;
  END IF;
  
  ALTER TABLE customer_wallet
    ADD CONSTRAINT customer_wallet_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
    
  RAISE NOTICE 'customer_wallet.user_id -> profiles.id';
END $$;

-- 4. wallet_transactions.user_id -> profiles.id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'wallet_transactions_user_id_fkey'
      AND table_name = 'wallet_transactions'
  ) THEN
    ALTER TABLE wallet_transactions DROP CONSTRAINT wallet_transactions_user_id_fkey;
  END IF;
  
  ALTER TABLE wallet_transactions
    ADD CONSTRAINT wallet_transactions_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
    
  RAISE NOTICE 'wallet_transactions.user_id -> profiles.id';
END $$;