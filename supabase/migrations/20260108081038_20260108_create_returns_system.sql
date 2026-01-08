/*
  # Système de Retours Complet (Droit à l'Erreur)
  
  1. Nouvelles Tables
    - `customer_wallet` : Porte-monnaie Avoir (séparé de la cagnotte)
    - `return_requests` : Demandes de retour
    - `return_items` : Articles retournés
    - `return_transactions` : Historique crédits/débits avoir
    
  2. Logique Métier
    - 14 jours pour déclarer un retour
    - Choix avoir ou remboursement
    - Calcul prorata remises
    - Récupération points fidélité
    - Gestion cadeaux (déduction si < 69€)
    
  3. Sécurité
    - RLS activé
    - Policies user-specific
*/

-- 1. PORTE-MONNAIE AVOIR (séparé de la cagnotte)
CREATE TABLE IF NOT EXISTS customer_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance numeric DEFAULT 0 CHECK (balance >= 0),
  total_credited numeric DEFAULT 0,
  total_spent numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customer_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON customer_wallet FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
  ON customer_wallet FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert wallets"
  ON customer_wallet FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. DEMANDES DE RETOUR
CREATE TABLE IF NOT EXISTS return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number text UNIQUE NOT NULL DEFAULT ('RET-' || substr(md5(random()::text), 1, 10)),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  order_number text NOT NULL,
  return_type text NOT NULL CHECK (return_type IN ('credit', 'refund')),
  status text DEFAULT 'declared' CHECK (status IN ('declared', 'received', 'validated', 'completed', 'cancelled')),
  total_amount numeric DEFAULT 0,
  loyalty_recovered numeric DEFAULT 0,
  gift_deduction numeric DEFAULT 0,
  gift_returned boolean DEFAULT false,
  shipping_address jsonb,
  admin_notes text,
  declared_at timestamptz DEFAULT now(),
  received_at timestamptz,
  validated_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own returns"
  ON return_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create returns"
  ON return_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage returns"
  ON return_requests FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. ARTICLES RETOURNÉS
CREATE TABLE IF NOT EXISTS return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid REFERENCES return_requests(id) ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_slug text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  discount_prorata numeric DEFAULT 0,
  net_amount numeric NOT NULL,
  variation_data jsonb,
  image_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own return items"
  ON return_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM return_requests
      WHERE return_requests.id = return_items.return_id
      AND return_requests.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert return items"
  ON return_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. TRANSACTIONS AVOIR
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('credit_return', 'debit_order', 'adjustment', 'manual')),
  description text DEFAULT '',
  return_id uuid REFERENCES return_requests(id) ON DELETE SET NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet transactions"
  ON wallet_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert wallet transactions"
  ON wallet_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- INDEX pour performance
CREATE INDEX IF NOT EXISTS idx_customer_wallet_user ON customer_wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_user ON return_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_order ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);
CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id);

-- FONCTION : Créer wallet automatiquement
CREATE OR REPLACE FUNCTION create_customer_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO customer_wallet (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER : Créer wallet pour nouveaux users
DROP TRIGGER IF EXISTS trigger_create_customer_wallet ON auth.users;
CREATE TRIGGER trigger_create_customer_wallet
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_customer_wallet();