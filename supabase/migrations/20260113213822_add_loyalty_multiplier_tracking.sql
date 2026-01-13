/*
  # Ajout du système de multiplicateur de fidélité

  1. Modifications
    - Ajout de colonnes pour suivre les gains et le multiplicateur
    - Ajout de colonnes pour la connexion journalière
    - Ajout d'une fonction pour calculer le multiplicateur actif

  2. Nouvelles colonnes dans profiles
    - daily_login_date (date de dernière connexion journalière)
    - daily_login_earned_today (montant gagné aujourd'hui)
    - current_multiplier (multiplicateur actuel: 1, 2 ou 3)
*/

-- Ajouter les colonnes de suivi du multiplicateur
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'daily_login_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_login_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'daily_login_earned_today'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_login_earned_today numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'current_multiplier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_multiplier integer DEFAULT 1;
  END IF;
END $$;

-- Fonction pour calculer le multiplicateur basé sur la cagnotte
CREATE OR REPLACE FUNCTION calculate_loyalty_multiplier(loyalty_euros_value numeric)
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  IF loyalty_euros_value >= 15 THEN
    RETURN 3;
  ELSIF loyalty_euros_value >= 5 THEN
    RETURN 2;
  ELSE
    RETURN 1;
  END IF;
END;
$$;

-- Créer une table pour l'historique des gains de fidélité
CREATE TABLE IF NOT EXISTS loyalty_earnings_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  source text NOT NULL, -- 'daily_login', 'hidden_diamond', 'live_shopping', 'review', 'cashback'
  multiplier integer DEFAULT 1,
  amount_with_multiplier numeric(10,2) NOT NULL,
  earned_at timestamptz DEFAULT now(),
  
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_multiplier CHECK (multiplier IN (1, 2, 3))
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_loyalty_earnings_user_id ON loyalty_earnings_history(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_earnings_earned_at ON loyalty_earnings_history(earned_at);

-- RLS pour loyalty_earnings_history
ALTER TABLE loyalty_earnings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loyalty earnings history"
  ON loyalty_earnings_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own loyalty earnings"
  ON loyalty_earnings_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
