/*
  # Ajout des colonnes wallet_balance et loyalty_points à profiles
  
  1. Colonnes ajoutées
    - wallet_balance (NUMERIC) : Solde du porte-monnaie avoir
    - loyalty_points (INTEGER) : Points de fidélité accumulés
    
  2. Valeurs par défaut
    - wallet_balance : 0.00
    - loyalty_points : 0
    
  3. Contraintes
    - wallet_balance >= 0
    - loyalty_points >= 0
*/

-- Ajouter wallet_balance si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'wallet_balance'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN wallet_balance NUMERIC(10,2) DEFAULT 0.00 CHECK (wallet_balance >= 0);
    
    RAISE NOTICE 'Colonne wallet_balance ajoutée à profiles';
  ELSE
    RAISE NOTICE 'Colonne wallet_balance existe déjà';
  END IF;
END $$;

-- Ajouter loyalty_points si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'loyalty_points'
  ) THEN
    ALTER TABLE profiles
      ADD COLUMN loyalty_points INTEGER DEFAULT 0 CHECK (loyalty_points >= 0);
    
    RAISE NOTICE 'Colonne loyalty_points ajoutée à profiles';
  ELSE
    RAISE NOTICE 'Colonne loyalty_points existe déjà';
  END IF;
END $$;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_balance ON profiles(wallet_balance) WHERE wallet_balance > 0;
CREATE INDEX IF NOT EXISTS idx_profiles_loyalty_points ON profiles(loyalty_points) WHERE loyalty_points > 0;