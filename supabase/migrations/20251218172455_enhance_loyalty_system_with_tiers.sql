/*
  # Enhanced Loyalty System with Tiers and Euro-based Rewards

  1. Changes to Loyalty System
    - Replace points system with euro-based system
    - Add tier system (Palier 1: 0-5€ 1x, Palier 2: 5-15€ 2x, Palier 3: 15-30€ 3x)
    - Add daily connection rewards (0,10€)
    - Add live presence rewards (0,20€ for 10+ minutes)
    - Add order rewards (2% of order total excluding shipping)
    - Track lifetime earnings and current balance

  2. New Tables
    - `loyalty_transactions` - Track all loyalty earnings
    - `daily_connection_rewards` - Track daily connection bonuses
    - `live_presence_rewards` - Track live viewing rewards
    - `hidden_diamonds` - Weekly treasure hunt system (3 diamonds/week, 0,10€ each)
    - `diamond_finds` - Track which diamonds users have found
    - `cross_promotion_coupons` - Coupons for live→site and site→live

  3. Security
    - Enable RLS on all new tables
    - Policies for authenticated users to manage their own data
    - Admin policies for diamond management
*/

-- Drop existing loyalty tables if they exist
DROP TABLE IF EXISTS loyalty_transactions CASCADE;
DROP TABLE IF EXISTS daily_connection_rewards CASCADE;
DROP TABLE IF EXISTS live_presence_rewards CASCADE;
DROP TABLE IF EXISTS hidden_diamonds CASCADE;
DROP TABLE IF EXISTS diamond_finds CASCADE;
DROP TABLE IF EXISTS cross_promotion_coupons CASCADE;

-- Loyalty transactions table (all earnings history)
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('daily_connection', 'live_presence', 'order_reward', 'diamond_find', 'review_reward', 'referral_reward', 'birthday_bonus', 'admin_adjustment')),
  description text NOT NULL,
  reference_id text,
  multiplier integer DEFAULT 1 CHECK (multiplier IN (1, 2, 3)),
  base_amount decimal(10,2),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created_at ON loyalty_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_type ON loyalty_transactions(type);

-- Daily connection rewards (0,10€ per day)
CREATE TABLE IF NOT EXISTS daily_connection_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reward_date date NOT NULL DEFAULT CURRENT_DATE,
  amount decimal(10,2) DEFAULT 0.10 NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, reward_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_connection_user_date ON daily_connection_rewards(user_id, reward_date);

-- Live presence rewards (0,20€ for 10+ minutes)
CREATE TABLE IF NOT EXISTS live_presence_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stream_id uuid NOT NULL,
  watch_duration_minutes integer NOT NULL,
  amount decimal(10,2) DEFAULT 0.20 NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, stream_id)
);

CREATE INDEX IF NOT EXISTS idx_live_presence_user_stream ON live_presence_rewards(user_id, stream_id);

-- Hidden diamonds (weekly treasure hunt)
CREATE TABLE IF NOT EXISTS hidden_diamonds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  page_url text NOT NULL,
  element_selector text NOT NULL,
  reward_amount decimal(10,2) DEFAULT 0.10 NOT NULL,
  week_start_date date NOT NULL,
  week_end_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hidden_diamonds_active ON hidden_diamonds(is_active, week_start_date, week_end_date);

-- Diamond finds (track which users found which diamonds)
CREATE TABLE IF NOT EXISTS diamond_finds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  diamond_id uuid REFERENCES hidden_diamonds(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) DEFAULT 0.10 NOT NULL,
  found_at timestamptz DEFAULT now(),
  UNIQUE(user_id, diamond_id)
);

CREATE INDEX IF NOT EXISTS idx_diamond_finds_user ON diamond_finds(user_id);
CREATE INDEX IF NOT EXISTS idx_diamond_finds_diamond ON diamond_finds(diamond_id);

-- Cross promotion coupons (live→site and site→live)
CREATE TABLE IF NOT EXISTS cross_promotion_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  coupon_code text UNIQUE NOT NULL,
  coupon_type text NOT NULL CHECK (coupon_type IN ('live_to_site', 'site_to_live')),
  discount_amount decimal(10,2) DEFAULT 2.00 NOT NULL,
  minimum_purchase decimal(10,2) DEFAULT 10.00 NOT NULL,
  order_id text NOT NULL,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz NOT NULL,
  is_used boolean DEFAULT false,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cross_promotion_user ON cross_promotion_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_cross_promotion_code ON cross_promotion_coupons(coupon_code);
CREATE INDEX IF NOT EXISTS idx_cross_promotion_validity ON cross_promotion_coupons(valid_until, is_used);

-- Enable RLS
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_connection_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_presence_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE hidden_diamonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE diamond_finds ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_promotion_coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies for loyalty_transactions
CREATE POLICY "Users can view own loyalty transactions"
  ON loyalty_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all loyalty transactions"
  ON loyalty_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "System can insert loyalty transactions"
  ON loyalty_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for daily_connection_rewards
CREATE POLICY "Users can view own daily rewards"
  ON daily_connection_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily rewards"
  ON daily_connection_rewards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for live_presence_rewards
CREATE POLICY "Users can view own live rewards"
  ON live_presence_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own live rewards"
  ON live_presence_rewards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for hidden_diamonds
CREATE POLICY "Anyone can view active diamonds"
  ON hidden_diamonds FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage diamonds"
  ON hidden_diamonds FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- RLS Policies for diamond_finds
CREATE POLICY "Users can view own diamond finds"
  ON diamond_finds FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diamond finds"
  ON diamond_finds FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for cross_promotion_coupons
CREATE POLICY "Users can view own coupons"
  ON cross_promotion_coupons FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create coupons"
  ON cross_promotion_coupons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own coupons"
  ON cross_promotion_coupons FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all coupons"
  ON cross_promotion_coupons FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Function to get user's current loyalty balance
CREATE OR REPLACE FUNCTION get_loyalty_balance(p_user_id uuid)
RETURNS decimal(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance decimal(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0)
  INTO v_balance
  FROM loyalty_transactions
  WHERE user_id = p_user_id;

  RETURN v_balance;
END;
$$;

-- Function to get user's current tier and multiplier
CREATE OR REPLACE FUNCTION get_loyalty_tier(p_user_id uuid)
RETURNS TABLE (
  tier integer,
  multiplier integer,
  tier_name text,
  current_balance decimal(10,2),
  next_tier_threshold decimal(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance decimal(10,2);
BEGIN
  v_balance := get_loyalty_balance(p_user_id);

  IF v_balance >= 15 THEN
    RETURN QUERY SELECT
      3 as tier,
      3 as multiplier,
      'Palier 3' as tier_name,
      v_balance as current_balance,
      30.00 as next_tier_threshold;
  ELSIF v_balance >= 5 THEN
    RETURN QUERY SELECT
      2 as tier,
      2 as multiplier,
      'Palier 2' as tier_name,
      v_balance as current_balance,
      15.00 as next_tier_threshold;
  ELSE
    RETURN QUERY SELECT
      1 as tier,
      1 as multiplier,
      'Palier 1' as tier_name,
      v_balance as current_balance,
      5.00 as next_tier_threshold;
  END IF;
END;
$$;

-- Function to award daily connection bonus
CREATE OR REPLACE FUNCTION award_daily_connection_bonus(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier_info record;
  v_base_amount decimal(10,2) := 0.10;
  v_final_amount decimal(10,2);
  v_reward_id uuid;
  v_transaction_id uuid;
BEGIN
  -- Check if already awarded today
  IF EXISTS (
    SELECT 1 FROM daily_connection_rewards
    WHERE user_id = p_user_id
    AND reward_date = CURRENT_DATE
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Already awarded today'
    );
  END IF;

  -- Get user's tier and multiplier
  SELECT * INTO v_tier_info FROM get_loyalty_tier(p_user_id);

  -- Calculate final amount with multiplier
  v_final_amount := v_base_amount * v_tier_info.multiplier;

  -- Insert daily reward
  INSERT INTO daily_connection_rewards (user_id, reward_date, amount)
  VALUES (p_user_id, CURRENT_DATE, v_final_amount)
  RETURNING id INTO v_reward_id;

  -- Insert loyalty transaction
  INSERT INTO loyalty_transactions (
    user_id,
    amount,
    type,
    description,
    reference_id,
    multiplier,
    base_amount
  )
  VALUES (
    p_user_id,
    v_final_amount,
    'daily_connection',
    'Coucou, ravie de te revoir ! Ta cagnotte vient de grimper de ' || v_final_amount::text || ' €.',
    v_reward_id::text,
    v_tier_info.multiplier,
    v_base_amount
  )
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'amount', v_final_amount,
    'message', 'Coucou, ravie de te revoir ! Ta cagnotte vient de grimper de ' || v_final_amount::text || ' €.',
    'transaction_id', v_transaction_id
  );
END;
$$;

-- Function to award live presence bonus
CREATE OR REPLACE FUNCTION award_live_presence_bonus(
  p_user_id uuid,
  p_stream_id uuid,
  p_watch_duration_minutes integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier_info record;
  v_base_amount decimal(10,2) := 0.20;
  v_final_amount decimal(10,2);
  v_reward_id uuid;
  v_transaction_id uuid;
BEGIN
  -- Check if watch duration meets minimum requirement
  IF p_watch_duration_minutes < 10 THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Minimum 10 minutes required'
    );
  END IF;

  -- Check if already awarded for this stream
  IF EXISTS (
    SELECT 1 FROM live_presence_rewards
    WHERE user_id = p_user_id
    AND stream_id = p_stream_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Already awarded for this stream'
    );
  END IF;

  -- Get user's tier and multiplier
  SELECT * INTO v_tier_info FROM get_loyalty_tier(p_user_id);

  -- Calculate final amount with multiplier
  v_final_amount := v_base_amount * v_tier_info.multiplier;

  -- Insert live presence reward
  INSERT INTO live_presence_rewards (user_id, stream_id, watch_duration_minutes, amount)
  VALUES (p_user_id, p_stream_id, p_watch_duration_minutes, v_final_amount)
  RETURNING id INTO v_reward_id;

  -- Insert loyalty transaction
  INSERT INTO loyalty_transactions (
    user_id,
    amount,
    type,
    description,
    reference_id,
    multiplier,
    base_amount
  )
  VALUES (
    p_user_id,
    v_final_amount,
    'live_presence',
    'Bravo, grâce à ta présence en live, tu viens de faire grimper ta cagnotte de ' || v_final_amount::text || ' €.',
    v_reward_id::text,
    v_tier_info.multiplier,
    v_base_amount
  )
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'amount', v_final_amount,
    'message', 'Bravo, grâce à ta présence en live, tu viens de faire grimper ta cagnotte de ' || v_final_amount::text || ' €.',
    'transaction_id', v_transaction_id
  );
END;
$$;

-- Function to award order reward (2% of order total)
CREATE OR REPLACE FUNCTION award_order_loyalty_reward(
  p_user_id uuid,
  p_order_id text,
  p_order_total decimal(10,2)
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tier_info record;
  v_base_amount decimal(10,2);
  v_final_amount decimal(10,2);
  v_transaction_id uuid;
BEGIN
  -- Calculate base amount (2% of order total)
  v_base_amount := p_order_total * 0.02;

  -- Get user's tier and multiplier
  SELECT * INTO v_tier_info FROM get_loyalty_tier(p_user_id);

  -- Calculate final amount with multiplier
  v_final_amount := v_base_amount * v_tier_info.multiplier;

  -- Insert loyalty transaction
  INSERT INTO loyalty_transactions (
    user_id,
    amount,
    type,
    description,
    reference_id,
    multiplier,
    base_amount
  )
  VALUES (
    p_user_id,
    v_final_amount,
    'order_reward',
    'Félicitations, grâce à ta commande, tu viens de faire grimper ta cagnotte de ' || v_final_amount::text || ' € ! Merci pour ta fidélité.',
    p_order_id,
    v_tier_info.multiplier,
    v_base_amount
  )
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'amount', v_final_amount,
    'message', 'Félicitations, grâce à ta commande, tu viens de faire grimper ta cagnotte de ' || v_final_amount::text || ' € ! Merci pour ta fidélité.',
    'transaction_id', v_transaction_id
  );
END;
$$;

-- Function to award diamond find bonus
CREATE OR REPLACE FUNCTION award_diamond_find_bonus(
  p_user_id uuid,
  p_diamond_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_diamond record;
  v_find_id uuid;
  v_transaction_id uuid;
BEGIN
  -- Check if diamond exists and is active
  SELECT * INTO v_diamond
  FROM hidden_diamonds
  WHERE id = p_diamond_id
  AND is_active = true
  AND CURRENT_DATE BETWEEN week_start_date AND week_end_date;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Diamond not found or not active'
    );
  END IF;

  -- Check if user already found this diamond
  IF EXISTS (
    SELECT 1 FROM diamond_finds
    WHERE user_id = p_user_id
    AND diamond_id = p_diamond_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Already found this diamond'
    );
  END IF;

  -- Insert diamond find
  INSERT INTO diamond_finds (user_id, diamond_id, amount)
  VALUES (p_user_id, p_diamond_id, v_diamond.reward_amount)
  RETURNING id INTO v_find_id;

  -- Insert loyalty transaction
  INSERT INTO loyalty_transactions (
    user_id,
    amount,
    type,
    description,
    reference_id,
    multiplier,
    base_amount
  )
  VALUES (
    p_user_id,
    v_diamond.reward_amount,
    'diamond_find',
    'Super, tu as trouvé un diamant qui te rapporte ' || v_diamond.reward_amount::text || ' € à ta cagnotte.',
    v_find_id::text,
    1,
    v_diamond.reward_amount
  )
  RETURNING id INTO v_transaction_id;

  RETURN json_build_object(
    'success', true,
    'amount', v_diamond.reward_amount,
    'message', 'Super, tu as trouvé un diamant qui te rapporte ' || v_diamond.reward_amount::text || ' € à ta cagnotte.',
    'transaction_id', v_transaction_id
  );
END;
$$;

-- Function to create cross-promotion coupon after order
CREATE OR REPLACE FUNCTION create_cross_promotion_coupon(
  p_user_id uuid,
  p_order_id text,
  p_order_source text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon_code text;
  v_coupon_type text;
  v_coupon_id uuid;
  v_valid_until timestamptz;
BEGIN
  -- Determine coupon type based on order source
  IF p_order_source = 'live' THEN
    v_coupon_type := 'live_to_site';
    v_coupon_code := 'LIVE2SITE-' || substr(md5(random()::text), 1, 8);
  ELSE
    v_coupon_type := 'site_to_live';
    v_coupon_code := 'SITE2LIVE-' || substr(md5(random()::text), 1, 8);
  END IF;

  -- Set expiration to 4 days from now
  v_valid_until := now() + interval '4 days';

  -- Insert coupon
  INSERT INTO cross_promotion_coupons (
    user_id,
    coupon_code,
    coupon_type,
    discount_amount,
    minimum_purchase,
    order_id,
    valid_until
  )
  VALUES (
    p_user_id,
    v_coupon_code,
    v_coupon_type,
    2.00,
    10.00,
    p_order_id,
    v_valid_until
  )
  RETURNING id INTO v_coupon_id;

  RETURN json_build_object(
    'success', true,
    'coupon_id', v_coupon_id,
    'coupon_code', v_coupon_code,
    'coupon_type', v_coupon_type,
    'discount_amount', 2.00,
    'minimum_purchase', 10.00,
    'valid_until', v_valid_until
  );
END;
$$;