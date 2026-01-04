/*
  # Système de parrainage

  1. Nouvelles tables
    - `referral_codes` : Codes de parrainage uniques par utilisateur
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key vers auth.users)
      - `code` (text, unique, code de parrainage)
      - `total_referrals` (integer, nombre de parrainages réussis)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `referrals` : Suivi des parrainages
      - `id` (uuid, primary key)
      - `referrer_id` (uuid, foreign key vers auth.users - le parrain)
      - `referred_id` (uuid, foreign key vers auth.users - le filleul)
      - `referral_code` (text, code utilisé)
      - `status` (text, statut: pending, completed, expired)
      - `referrer_coupon_id` (uuid, foreign key vers user_coupons)
      - `referred_coupon_id` (uuid, foreign key vers user_coupons)
      - `completed_at` (timestamptz, date de validation)
      - `created_at` (timestamptz)

  2. Types de coupons par défaut
    - Créer un type de coupon "PARRAINAGE8" pour les parrainages
    - 8€ de réduction

  3. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour que les clients voient leurs propres données
    - Policies admin pour gérer toutes les données
*/

-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  code text UNIQUE NOT NULL,
  total_referrals integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  referrer_coupon_id uuid REFERENCES user_coupons(id) ON DELETE SET NULL,
  referred_coupon_id uuid REFERENCES user_coupons(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(referred_id)
);

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Policies for referral_codes
CREATE POLICY "Users can view own referral code"
  ON referral_codes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own referral code"
  ON referral_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all referral codes"
  ON referral_codes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policies for referrals
CREATE POLICY "Users can view own referrals as referrer"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "System can insert referrals"
  ON referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all referrals"
  ON referrals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all referrals"
  ON referrals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- Create or update referral coupon type
DO $$
DECLARE
  v_coupon_type_id uuid;
BEGIN
  -- Check if referral coupon type exists
  SELECT id INTO v_coupon_type_id
  FROM coupon_types
  WHERE code = 'PARRAINAGE8';

  IF v_coupon_type_id IS NULL THEN
    -- Create referral coupon type
    INSERT INTO coupon_types (
      code,
      type,
      value,
      description,
      valid_until,
      is_active
    )
    VALUES (
      'PARRAINAGE8',
      'discount_amount',
      8,
      'Parrainage : 8€ de réduction',
      '2099-12-31'::timestamptz,
      true
    );
  END IF;
END $$;

-- Function to generate referral code for user
CREATE OR REPLACE FUNCTION generate_referral_code_for_user(p_user_id uuid)
RETURNS text AS $$
DECLARE
  v_code text;
  v_exists boolean;
BEGIN
  -- Check if user already has a referral code
  SELECT code INTO v_code
  FROM referral_codes
  WHERE user_id = p_user_id;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  -- Generate unique referral code
  LOOP
    v_code := 'REF-' || UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8));
    
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE code = v_code) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;

  -- Insert referral code
  INSERT INTO referral_codes (user_id, code)
  VALUES (p_user_id, v_code);

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process referral and create coupons
CREATE OR REPLACE FUNCTION process_referral(p_referral_code text, p_referred_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_referrer_id uuid;
  v_coupon_type_id uuid;
  v_referrer_coupon_id uuid;
  v_referred_coupon_id uuid;
  v_referral_id uuid;
  v_result jsonb;
BEGIN
  -- Get referrer from code
  SELECT user_id INTO v_referrer_id
  FROM referral_codes
  WHERE code = p_referral_code;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code de parrainage invalide');
  END IF;

  -- Check if referred user already used a referral code
  IF EXISTS(SELECT 1 FROM referrals WHERE referred_id = p_referred_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vous avez déjà utilisé un code de parrainage');
  END IF;

  -- Get referral coupon type
  SELECT id INTO v_coupon_type_id
  FROM coupon_types
  WHERE code = 'PARRAINAGE8'
  LIMIT 1;

  IF v_coupon_type_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Type de coupon introuvable');
  END IF;

  -- Create coupon for referrer
  INSERT INTO user_coupons (
    user_id,
    coupon_type_id,
    code,
    source,
    valid_until
  )
  VALUES (
    v_referrer_id,
    v_coupon_type_id,
    'PARRAINAGE-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)),
    'loyalty',
    CURRENT_DATE + INTERVAL '90 days'
  )
  RETURNING id INTO v_referrer_coupon_id;

  -- Create coupon for referred
  INSERT INTO user_coupons (
    user_id,
    coupon_type_id,
    code,
    source,
    valid_until
  )
  VALUES (
    p_referred_id,
    v_coupon_type_id,
    'PARRAINAGE-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)),
    'loyalty',
    CURRENT_DATE + INTERVAL '90 days'
  )
  RETURNING id INTO v_referred_coupon_id;

  -- Create referral record
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    referral_code,
    status,
    referrer_coupon_id,
    referred_coupon_id,
    completed_at
  )
  VALUES (
    v_referrer_id,
    p_referred_id,
    p_referral_code,
    'completed',
    v_referrer_coupon_id,
    v_referred_coupon_id,
    now()
  )
  RETURNING id INTO v_referral_id;

  -- Update referral code total
  UPDATE referral_codes
  SET total_referrals = total_referrals + 1,
      updated_at = now()
  WHERE user_id = v_referrer_id;

  RETURN jsonb_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_coupon_id', v_referrer_coupon_id,
    'referred_coupon_id', v_referred_coupon_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_referral_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_referral_codes_updated_at_trigger ON referral_codes;
CREATE TRIGGER update_referral_codes_updated_at_trigger
  BEFORE UPDATE ON referral_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_referral_codes_updated_at();