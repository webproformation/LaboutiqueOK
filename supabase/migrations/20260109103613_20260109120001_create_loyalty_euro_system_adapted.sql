/*
  # Système de Fidélité en Euros - La Boutique de Morgane (Version Adaptée)

  1. **Vue d'ensemble**
     - Système de fidélité basé sur des euros (€) au lieu de points
     - Système de paliers avec multiplicateurs progressifs
     - Récompenses automatiques pour diverses actions
     - Adapté aux tables existantes

  2. **Tables créées**
     - `loyalty_euro_transactions` : Historique des gains/dépenses en euros
     - `daily_connection_tracking` : Suivi des connexions quotidiennes

  3. **Tables modifiées**
     - `loyalty_tiers` : Utilisation de la table existante
     - `profiles` : Ajout de colonnes pour le système euro

  4. **Paliers de fidélité**
     - Palier 1 : 0 à 5€ (gains normaux)
     - Palier 2 : 5 à 15€ (gains doublés x2)
     - Palier 3 : 15 à 30€ (gains triplés x3)

  5. **Types de gains**
     - `daily_connection` : 0,10€ par jour de connexion
     - `live_attendance` : 0,20€ pour 10 min+ en live
     - `order_reward` : 2% du montant HT de commande
     - `diamond_found` : 0,10€ par diamant trouvé
     - `review_posted` : 0,20€ par avis déposé

  6. **Sécurité**
     - RLS activé sur toutes les tables
     - Les utilisateurs peuvent consulter leur propre historique
     - Seuls les admins peuvent modifier les transactions
     - Triggers automatiques pour mise à jour du palier
*/

-- =====================================================
-- 1. MISE À JOUR DE LA TABLE LOYALTY_TIERS EXISTANTE
-- =====================================================

-- Mise à jour des données des paliers pour le système euro
UPDATE loyalty_tiers SET
  tier_number = 1,
  min_amount = 0.00,
  max_amount = 5.00,
  multiplier = 1,
  name = 'Palier 1 - Découverte',
  description = 'Gains normaux'
WHERE tier_number = 1;

INSERT INTO loyalty_tiers (id, tier_number, min_amount, max_amount, multiplier, name, description)
VALUES (gen_random_uuid(), 2, 5.00, 15.00, 2, 'Palier 2 - Fidèle', 'Gains doublés')
ON CONFLICT DO NOTHING;

INSERT INTO loyalty_tiers (id, tier_number, min_amount, max_amount, multiplier, name, description)
VALUES (gen_random_uuid(), 3, 15.00, 30.00, 3, 'Palier 3 - VIP', 'Gains triplés')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. AJOUT DES COLONNES DANS PROFILES
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'loyalty_euros'
  ) THEN
    ALTER TABLE profiles ADD COLUMN loyalty_euros DECIMAL(10, 2) DEFAULT 0.00 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'current_tier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_tier INTEGER DEFAULT 1 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'tier_multiplier'
  ) THEN
    ALTER TABLE profiles ADD COLUMN tier_multiplier INTEGER DEFAULT 1 NOT NULL;
  END IF;
END $$;

-- =====================================================
-- 3. TABLE DES TRANSACTIONS DE FIDÉLITÉ
-- =====================================================

CREATE TABLE IF NOT EXISTS loyalty_euro_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN (
      'daily_connection',
      'live_attendance',
      'order_reward',
      'diamond_found',
      'review_posted',
      'spent'
    )
  ),
  amount DECIMAL(10, 2) NOT NULL,
  multiplier_applied INTEGER DEFAULT 1,
  actual_amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON loyalty_euro_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_euro_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_date ON loyalty_euro_transactions(created_at);

-- =====================================================
-- 4. TABLE DE SUIVI DES CONNEXIONS QUOTIDIENNES
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_connection_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, connection_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_connection_user_date ON daily_connection_tracking(user_id, connection_date);

-- =====================================================
-- 5. FONCTION DE MISE À JOUR DU PALIER
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_loyalty_tier()
RETURNS TRIGGER AS $$
DECLARE
  new_tier RECORD;
BEGIN
  -- Trouver le palier correspondant au montant (utilise les colonnes existantes)
  SELECT tier_number, multiplier, name
  INTO new_tier
  FROM loyalty_tiers
  WHERE NEW.loyalty_euros >= min_amount AND NEW.loyalty_euros < max_amount
  ORDER BY tier_number
  LIMIT 1;

  -- Si trouvé, mettre à jour le palier
  IF FOUND THEN
    NEW.current_tier := new_tier.tier_number;
    NEW.tier_multiplier := new_tier.multiplier;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique du palier
DROP TRIGGER IF EXISTS trigger_update_loyalty_tier ON profiles;
CREATE TRIGGER trigger_update_loyalty_tier
  BEFORE UPDATE OF loyalty_euros ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_loyalty_tier();

-- =====================================================
-- 6. FONCTION D'AJOUT DE TRANSACTION
-- =====================================================

CREATE OR REPLACE FUNCTION add_loyalty_transaction(
  p_user_id UUID,
  p_type TEXT,
  p_base_amount DECIMAL,
  p_description TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_multiplier INTEGER;
  v_actual_amount DECIMAL;
BEGIN
  -- Récupérer le multiplicateur actuel
  SELECT tier_multiplier INTO v_multiplier
  FROM profiles
  WHERE id = p_user_id;

  -- Si pas de multiplicateur, utiliser 1 par défaut
  IF v_multiplier IS NULL THEN
    v_multiplier := 1;
  END IF;

  -- Calculer le montant réel avec multiplicateur
  v_actual_amount := p_base_amount * v_multiplier;

  -- Insérer la transaction
  INSERT INTO loyalty_euro_transactions (
    user_id,
    transaction_type,
    amount,
    multiplier_applied,
    actual_amount,
    description,
    reference_id
  ) VALUES (
    p_user_id,
    p_type,
    p_base_amount,
    v_multiplier,
    v_actual_amount,
    p_description,
    p_reference_id
  );

  -- Mettre à jour le total
  UPDATE profiles
  SET loyalty_euros = COALESCE(loyalty_euros, 0) + v_actual_amount
  WHERE id = p_user_id;

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. FONCTION DE CONNEXION QUOTIDIENNE
-- =====================================================

CREATE OR REPLACE FUNCTION record_daily_connection(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_already_rewarded BOOLEAN DEFAULT FALSE;
BEGIN
  -- Vérifier si déjà récompensé aujourd'hui
  SELECT reward_given INTO v_already_rewarded
  FROM daily_connection_tracking
  WHERE user_id = p_user_id
    AND connection_date = CURRENT_DATE;

  IF v_already_rewarded IS TRUE THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Déjà récompensé aujourd''hui'
    );
  END IF;

  -- Enregistrer la connexion
  INSERT INTO daily_connection_tracking (user_id, connection_date, reward_given)
  VALUES (p_user_id, CURRENT_DATE, TRUE)
  ON CONFLICT (user_id, connection_date)
  DO UPDATE SET reward_given = TRUE;

  -- Ajouter la récompense
  PERFORM add_loyalty_transaction(
    p_user_id,
    'daily_connection',
    0.10,
    'Connexion quotidienne',
    NULL
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Coucou, ravie de te revoir ! Ta cagnotte vient de grimper de 0,10 €.',
    'amount', 0.10
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. RLS POLICIES
-- =====================================================

ALTER TABLE loyalty_euro_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_connection_tracking ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs voient leurs propres transactions
CREATE POLICY "Utilisateurs voient leurs transactions"
  ON loyalty_euro_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Seuls les admins peuvent insérer des transactions (+ fonction SECURITY DEFINER)
CREATE POLICY "Admins insèrent transactions"
  ON loyalty_euro_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Les utilisateurs voient leur suivi de connexion
CREATE POLICY "Utilisateurs voient leur suivi"
  ON daily_connection_tracking FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insertion via fonction SECURITY DEFINER
CREATE POLICY "Insertion suivi connexion via fonction"
  ON daily_connection_tracking FOR INSERT
  TO authenticated
  WITH CHECK (true);