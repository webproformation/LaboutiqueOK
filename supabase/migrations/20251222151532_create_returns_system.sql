/*
  # Système de Retours et Avoirs - Le Droit à l'Erreur

  1. Nouvelles Tables
    - `wallet_credits` (Avoirs / Porte-monnaie client)
      - `id` (uuid, primary key)
      - `user_id` (uuid, référence auth.users)
      - `balance` (numeric, solde disponible)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `wallet_transactions` (Historique des mouvements d'avoir)
      - `id` (uuid, primary key)
      - `wallet_id` (uuid, référence wallet_credits)
      - `amount` (numeric, montant - positif pour crédit, négatif pour débit)
      - `type` (text, type de transaction: 'credit_return', 'debit_order', 'refund')
      - `reference_id` (text, ID de référence - commande ou retour)
      - `description` (text)
      - `created_at` (timestamptz)
    
    - `returns` (Demandes de retour)
      - `id` (uuid, primary key)
      - `return_number` (text, unique, numéro de retour)
      - `user_id` (uuid, référence auth.users)
      - `order_id` (uuid, référence orders)
      - `woocommerce_order_id` (text, ID commande WooCommerce)
      - `return_type` (text, 'credit' ou 'refund')
      - `status` (text, 'declared', 'received', 'finalized')
      - `total_amount` (numeric, montant total du retour)
      - `loyalty_points_to_deduct` (numeric, points à récupérer)
      - `gift_value_deducted` (numeric, valeur cadeau déduite si applicable)
      - `gift_returned` (boolean, cadeau retourné?)
      - `notes` (text, notes admin)
      - `declared_at` (timestamptz)
      - `received_at` (timestamptz)
      - `finalized_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `return_items` (Articles retournés)
      - `id` (uuid, primary key)
      - `return_id` (uuid, référence returns)
      - `product_id` (text, ID produit WooCommerce)
      - `product_name` (text)
      - `quantity` (integer)
      - `unit_price` (numeric, prix unitaire catalogue)
      - `discount_amount` (numeric, remise proratisée)
      - `net_amount` (numeric, montant net à rembourser)
      - `loyalty_points_generated` (numeric, points générés par cet article)
      - `created_at` (timestamptz)
    
    - `gift_settings` (Paramètres des cadeaux)
      - `id` (uuid, primary key)
      - `minimum_order_amount` (numeric, montant minimum pour cadeau)
      - `gift_value` (numeric, valeur du cadeau pour déduction)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour accès utilisateur et admin
*/

-- Table wallet_credits
CREATE TABLE IF NOT EXISTS wallet_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance numeric(10,2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE wallet_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON wallet_credits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON wallet_credits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "System can insert wallets"
  ON wallet_credits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update wallets"
  ON wallet_credits FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Table wallet_transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES wallet_credits(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('credit_return', 'debit_order', 'refund', 'admin_adjustment')),
  reference_id text,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON wallet_transactions FOR SELECT
  TO authenticated
  USING (
    wallet_id IN (
      SELECT id FROM wallet_credits WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all transactions"
  ON wallet_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "System can insert transactions"
  ON wallet_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Table gift_settings
CREATE TABLE IF NOT EXISTS gift_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  minimum_order_amount numeric(10,2) DEFAULT 69.00 NOT NULL,
  gift_value numeric(10,2) DEFAULT 5.00 NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gift_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gift settings"
  ON gift_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage gift settings"
  ON gift_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Insert default gift settings
INSERT INTO gift_settings (minimum_order_amount, gift_value, is_active)
VALUES (69.00, 5.00, true)
ON CONFLICT DO NOTHING;

-- Table returns
CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  woocommerce_order_id text NOT NULL,
  return_type text NOT NULL CHECK (return_type IN ('credit', 'refund')),
  status text DEFAULT 'declared' NOT NULL CHECK (status IN ('declared', 'received', 'finalized')),
  total_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
  loyalty_points_to_deduct numeric(10,2) DEFAULT 0.00,
  gift_value_deducted numeric(10,2) DEFAULT 0.00,
  gift_returned boolean DEFAULT false,
  notes text,
  declared_at timestamptz DEFAULT now(),
  received_at timestamptz,
  finalized_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own returns"
  ON returns FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own returns"
  ON returns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all returns"
  ON returns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update returns"
  ON returns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Table return_items
CREATE TABLE IF NOT EXISTS return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid REFERENCES returns(id) ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  quantity integer DEFAULT 1 NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) DEFAULT 0.00 NOT NULL,
  discount_amount numeric(10,2) DEFAULT 0.00,
  net_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
  loyalty_points_generated numeric(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own return items"
  ON return_items FOR SELECT
  TO authenticated
  USING (
    return_id IN (
      SELECT id FROM returns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own return items"
  ON return_items FOR INSERT
  TO authenticated
  WITH CHECK (
    return_id IN (
      SELECT id FROM returns WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all return items"
  ON return_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Function: Generate return number
CREATE OR REPLACE FUNCTION generate_return_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_number text;
  number_exists boolean;
BEGIN
  LOOP
    new_number := 'RET-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(floor(random() * 10000)::text, 4, '0');
    
    SELECT EXISTS(SELECT 1 FROM returns WHERE return_number = new_number) INTO number_exists;
    
    IF NOT number_exists THEN
      RETURN new_number;
    END IF;
  END LOOP;
END;
$$;

-- Function: Create wallet for new user
CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO wallet_credits (user_id, balance)
  VALUES (NEW.id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger: Create wallet on user creation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'create_wallet_on_user_creation'
  ) THEN
    CREATE TRIGGER create_wallet_on_user_creation
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_wallet_for_user();
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_credits_user_id ON wallet_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_returns_user_id ON returns(user_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_return_number ON returns(return_number);
CREATE INDEX IF NOT EXISTS idx_return_items_return_id ON return_items(return_id);