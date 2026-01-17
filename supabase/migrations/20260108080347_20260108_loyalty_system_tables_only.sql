/*
  # Système de Fidélité - Tables Manquantes
  
  Création des tables manquantes pour le système de fidélité complet
*/

-- 1. CAGNOTTE FIDÉLITÉ
CREATE TABLE IF NOT EXISTS loyalty_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance numeric DEFAULT 0 CHECK (balance >= 0),
  current_level integer DEFAULT 1 CHECK (current_level BETWEEN 1 AND 3),
  total_earned numeric DEFAULT 0,
  total_spent numeric DEFAULT 0,
  last_daily_visit date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE loyalty_wallet ENABLE ROW LEVEL SECURITY;

-- 2. TRANSACTIONS V2 (en euros)
CREATE TABLE IF NOT EXISTS loyalty_transactions_v2 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('daily_visit', 'live_attendance', 'purchase', 'diamond', 'review', 'referral_giver', 'referral_receiver', 'manual', 'spent')),
  description text DEFAULT '',
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  multiplier integer DEFAULT 1 CHECK (multiplier IN (1, 2, 3)),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE loyalty_transactions_v2 ENABLE ROW LEVEL SECURITY;

-- 3. VISITES QUOTIDIENNES
CREATE TABLE IF NOT EXISTS daily_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  reward_amount numeric DEFAULT 0.10,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, visit_date)
);

ALTER TABLE daily_visits ENABLE ROW LEVEL SECURITY;

-- 4. DIAMANTS TROUVÉS
CREATE TABLE IF NOT EXISTS diamond_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  diamond_id uuid REFERENCES hidden_diamonds(id) ON DELETE CASCADE NOT NULL,
  reward_amount numeric DEFAULT 0.10,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, diamond_id)
);

ALTER TABLE diamond_findings ENABLE ROW LEVEL SECURITY;

-- 5. RÉCOMPENSES PARRAINAGE
CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code text NOT NULL,
  referrer_reward numeric DEFAULT 5.00,
  referred_reward numeric DEFAULT 5.00,
  created_at timestamptz DEFAULT now(),
  UNIQUE(referred_id)
);

ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- 6. COUPONS CROISÉS
CREATE TABLE IF NOT EXISTS cross_platform_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  code text UNIQUE NOT NULL,
  source_platform text NOT NULL CHECK (source_platform IN ('site', 'live', 'replay')),
  usable_on text NOT NULL CHECK (usable_on IN ('site', 'live', 'replay')),
  discount_amount numeric DEFAULT 2.00,
  min_purchase numeric DEFAULT 10.00,
  is_used boolean DEFAULT false,
  used_at timestamptz,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  valid_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cross_platform_coupons ENABLE ROW LEVEL SECURITY;

-- 7. RÉCOMPENSES AVIS
CREATE TABLE IF NOT EXISTS review_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  review_id text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  reward_amount numeric DEFAULT 0.20,
  created_at timestamptz DEFAULT now(),
  UNIQUE(review_id)
);

ALTER TABLE review_rewards ENABLE ROW LEVEL SECURITY;

-- 8. QUEUE EMAILS J+7
CREATE TABLE IF NOT EXISTS review_email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  first_name text NOT NULL,
  send_at timestamptz NOT NULL,
  sent_at timestamptz,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(order_id)
);

ALTER TABLE review_email_queue ENABLE ROW LEVEL SECURITY;

-- FONCTION HELPER
CREATE OR REPLACE FUNCTION get_loyalty_multiplier(user_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  wallet_balance numeric;
BEGIN
  SELECT balance INTO wallet_balance
  FROM loyalty_wallet
  WHERE user_id = user_id_param;
  
  IF wallet_balance IS NULL THEN
    RETURN 1;
  END IF;
  
  IF wallet_balance >= 15 THEN
    RETURN 3;
  ELSIF wallet_balance >= 5 THEN
    RETURN 2;
  ELSE
    RETURN 1;
  END IF;
END;
$$;

-- INDEX
CREATE INDEX IF NOT EXISTS idx_loyalty_wallet_user ON loyalty_wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_v2_user ON loyalty_transactions_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_visits_user_date ON daily_visits(user_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_diamond_findings_user ON diamond_findings(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_cross_coupons_code ON cross_platform_coupons(code);
CREATE INDEX IF NOT EXISTS idx_review_email_queue_send ON review_email_queue(send_at) WHERE status = 'pending';