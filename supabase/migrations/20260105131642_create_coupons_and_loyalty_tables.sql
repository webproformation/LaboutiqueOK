/*
  # Système de Coupons et Fidélité

  1. Nouvelles Tables
    - `coupon_types` : Types de coupons disponibles
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `type` (text : discount_amount, discount_percentage, free_delivery)
      - `value` (numeric)
      - `description` (text)
      - `valid_until` (timestamptz)
      - `is_active` (boolean)
      - `created_at` (timestamptz)

    - `user_coupons` : Coupons attribués aux utilisateurs
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK vers auth.users)
      - `coupon_type_id` (uuid, FK vers coupon_types)
      - `code` (text)
      - `source` (text : wheel, scratch, referral, admin)
      - `is_used` (boolean)
      - `used_at` (timestamptz)
      - `order_id` (uuid, FK vers orders)
      - `obtained_at` (timestamptz)
      - `valid_until` (timestamptz)
      - Contrainte unique : (user_id, code)

    - `loyalty_transactions` : Historique des transactions de cagnotte
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK vers auth.users)
      - `amount` (numeric)
      - `type` (text : order, referral, admin_adjustment, gift)
      - `description` (text)
      - `reference_id` (uuid)
      - `created_at` (timestamptz)

  2. Modifications
    - Ajout de `wallet_balance` à user_profiles si pas déjà présent

  3. Sécurité
    - Enable RLS sur toutes les tables
    - Users peuvent voir leurs propres coupons et transactions
    - Public peut voir les types de coupons actifs
*/

-- Table coupon_types
CREATE TABLE IF NOT EXISTS coupon_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('discount_amount', 'discount_percentage', 'free_delivery')),
  value numeric(10,2) NOT NULL,
  description text NOT NULL,
  valid_until timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coupon_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupon types"
  ON coupon_types FOR SELECT
  USING (is_active = true);

-- Insérer quelques exemples de types de coupons
INSERT INTO coupon_types (code, type, value, description, valid_until, is_active)
VALUES
  ('WELCOME10', 'discount_percentage', 10, 'Réduction de 10% sur votre première commande', '2026-12-31 23:59:59', true),
  ('FREEDELIVERY', 'free_delivery', 0, 'Livraison gratuite', '2026-12-31 23:59:59', true),
  ('5EUROS', 'discount_amount', 5, 'Réduction de 5€ sur votre commande', '2026-12-31 23:59:59', true),
  ('DIAMOND20', 'discount_percentage', 20, '20% de réduction - Carte diamant', '2026-12-31 23:59:59', true)
ON CONFLICT (code) DO NOTHING;

-- Table user_coupons
CREATE TABLE IF NOT EXISTS user_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  coupon_type_id uuid REFERENCES coupon_types(id) NOT NULL,
  code text NOT NULL,
  source text NOT NULL CHECK (source IN ('wheel', 'scratch', 'referral', 'admin', 'welcome')),
  is_used boolean DEFAULT false,
  used_at timestamptz,
  order_id uuid REFERENCES orders(id),
  obtained_at timestamptz DEFAULT now(),
  valid_until timestamptz NOT NULL,
  CONSTRAINT unique_user_coupon UNIQUE(user_id, code)
);

ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coupons"
  ON user_coupons FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Table loyalty_transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('order', 'referral', 'admin_adjustment', 'gift', 'withdrawal')),
  description text,
  reference_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON loyalty_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Ajouter wallet_balance à user_profiles si pas déjà présent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'wallet_balance'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN wallet_balance numeric(10,2) DEFAULT 0;
  END IF;
END $$;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_is_used ON user_coupons(is_used);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
