/*
  # Création du système de Cartes Cadeaux

  1. Nouvelles Tables
    - `gift_cards` : Cartes cadeaux avec codes uniques
    - `gift_card_transactions` : Historique d'utilisation des cartes
  
  2. Sécurité
    - RLS activé sur toutes les tables
    - Gift cards: Propriétaire ou destinataire peut voir
    - Transactions: Propriétaire de la carte peut voir
    - Admin a accès complet
  
  3. Fonctionnalités
    - Codes uniques générés automatiquement
    - Solde et valeur initiale trackés séparément
    - Validité d'un an par défaut
    - Support email destinataire ou auto-envoi
    - Personnalisation (from, to, message)
    - Historique des utilisations
*/

-- Table des cartes cadeaux
CREATE TABLE IF NOT EXISTS gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  initial_amount decimal(10,2) NOT NULL CHECK (initial_amount >= 10 AND initial_amount <= 1500),
  current_balance decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  from_name text,
  to_name text,
  custom_message text,
  delivery_method text NOT NULL DEFAULT 'my-email' CHECK (delivery_method IN ('my-email', 'recipient-email')),
  recipient_email text,
  purchaser_email text NOT NULL,
  purchaser_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id uuid,
  is_sent boolean DEFAULT false,
  sent_at timestamptz,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz DEFAULT (now() + interval '1 year'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_cards_purchaser ON gift_cards(purchaser_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient_email ON gift_cards(recipient_email);
CREATE INDEX IF NOT EXISTS idx_gift_cards_valid_until ON gift_cards(valid_until);

ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own gift cards"
  ON gift_cards
  FOR SELECT
  TO authenticated
  USING (
    purchaser_id = auth.uid() 
    OR recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can create gift cards"
  ON gift_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (purchaser_id = auth.uid());

CREATE POLICY "Admin can manage all gift cards"
  ON gift_cards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Table des transactions de cartes cadeaux
CREATE TABLE IF NOT EXISTS gift_card_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id uuid NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  order_id uuid,
  amount decimal(10,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('purchase', 'redemption', 'refund', 'adjustment')),
  balance_before decimal(10,2) NOT NULL,
  balance_after decimal(10,2) NOT NULL,
  description text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_card_id ON gift_card_transactions(gift_card_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_order_id ON gift_card_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_created_at ON gift_card_transactions(created_at DESC);

ALTER TABLE gift_card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transactions for their gift cards"
  ON gift_card_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM gift_cards
      WHERE gift_cards.id = gift_card_transactions.gift_card_id
      AND (
        gift_cards.purchaser_id = auth.uid()
        OR gift_cards.recipient_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "System can create transactions"
  ON gift_card_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can manage all transactions"
  ON gift_card_transactions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Fonction pour générer un code unique de carte cadeau
CREATE OR REPLACE FUNCTION generate_gift_card_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := 'GC-';
  i integer;
BEGIN
  FOR i IN 1..12 LOOP
    IF i IN (5, 9) THEN
      result := result || '-';
    END IF;
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour appliquer une carte cadeau
CREATE OR REPLACE FUNCTION apply_gift_card(
  p_code text,
  p_amount decimal,
  p_order_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_card gift_cards%ROWTYPE;
  v_result jsonb;
BEGIN
  -- Récupérer la carte
  SELECT * INTO v_card
  FROM gift_cards
  WHERE code = p_code
  AND status = 'active'
  AND valid_until > now()
  FOR UPDATE;

  -- Vérifier si la carte existe et est valide
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Carte cadeau invalide ou expirée'
    );
  END IF;

  -- Vérifier si le solde est suffisant
  IF v_card.current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Solde insuffisant',
      'available_balance', v_card.current_balance
    );
  END IF;

  -- Créer la transaction
  INSERT INTO gift_card_transactions (
    gift_card_id,
    order_id,
    amount,
    type,
    balance_before,
    balance_after,
    user_id,
    description
  ) VALUES (
    v_card.id,
    p_order_id,
    -p_amount,
    'redemption',
    v_card.current_balance,
    v_card.current_balance - p_amount,
    p_user_id,
    'Utilisation sur commande'
  );

  -- Mettre à jour le solde
  UPDATE gift_cards
  SET 
    current_balance = current_balance - p_amount,
    status = CASE 
      WHEN current_balance - p_amount <= 0 THEN 'used'
      ELSE 'active'
    END,
    updated_at = now()
  WHERE id = v_card.id;

  RETURN jsonb_build_object(
    'success', true,
    'amount_applied', p_amount,
    'remaining_balance', v_card.current_balance - p_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;