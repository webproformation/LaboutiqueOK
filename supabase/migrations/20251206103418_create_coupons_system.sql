/*
  # Create Coupons and Rewards System

  1. New Tables
    - `coupon_types`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Auto-generated code prefix
      - `type` (text) - 'discount_amount', 'discount_percentage', 'free_delivery'
      - `value` (numeric) - Amount or percentage value
      - `description` (text) - Description of the coupon
      - `valid_until` (timestamptz) - Expiration date
      - `is_active` (boolean) - Whether the coupon type is active
      - `created_at` (timestamptz)

    - `user_coupons`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `coupon_type_id` (uuid, foreign key to coupon_types)
      - `code` (text, unique) - Unique code for this specific coupon
      - `source` (text) - 'scratch_game', 'promotion', 'loyalty', 'gift'
      - `is_used` (boolean) - Whether the coupon has been used
      - `used_at` (timestamptz) - When the coupon was used
      - `order_id` (uuid) - Order where coupon was used
      - `obtained_at` (timestamptz) - When the user obtained this coupon
      - `valid_until` (timestamptz) - Expiration date
      - `created_at` (timestamptz)

    - `scratch_game_plays`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `result` (text) - 'win' or 'lose'
      - `coupon_id` (uuid, foreign key to user_coupons) - Nullable
      - `played_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read their own coupons
    - Add policies for users to view their game history
    - Add policies for creating new game plays

  3. Important Notes
    - Coupons are not cumulative with other active discounts
    - Each user can play the scratch game once (tracked by user_id)
    - Coupons have expiration dates
    - System tracks when and how coupons are obtained and used
*/

-- Create coupon_types table
CREATE TABLE IF NOT EXISTS coupon_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('discount_amount', 'discount_percentage', 'free_delivery')),
  value numeric NOT NULL DEFAULT 0,
  description text NOT NULL,
  valid_until timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create user_coupons table
CREATE TABLE IF NOT EXISTS user_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  coupon_type_id uuid REFERENCES coupon_types(id) ON DELETE CASCADE NOT NULL,
  code text UNIQUE NOT NULL,
  source text NOT NULL CHECK (source IN ('scratch_game', 'promotion', 'loyalty', 'gift')),
  is_used boolean DEFAULT false,
  used_at timestamptz,
  order_id uuid,
  obtained_at timestamptz DEFAULT now(),
  valid_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create scratch_game_plays table
CREATE TABLE IF NOT EXISTS scratch_game_plays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  result text NOT NULL CHECK (result IN ('win', 'lose')),
  coupon_id uuid REFERENCES user_coupons(id) ON DELETE SET NULL,
  played_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coupon_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE scratch_game_plays ENABLE ROW LEVEL SECURITY;

-- Policies for coupon_types (read-only for authenticated users)
CREATE POLICY "Anyone can view active coupon types"
  ON coupon_types FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policies for user_coupons
CREATE POLICY "Users can view own coupons"
  ON user_coupons FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own coupons"
  ON user_coupons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own unused coupons"
  ON user_coupons FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND is_used = false)
  WITH CHECK (auth.uid() = user_id);

-- Policies for scratch_game_plays
CREATE POLICY "Users can view own game plays"
  ON scratch_game_plays FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game plays"
  ON scratch_game_plays FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert initial coupon types for the scratch game
INSERT INTO coupon_types (code, type, value, description, valid_until, is_active)
VALUES
  ('FREE_DELIVERY', 'free_delivery', 0, 'Livraison offerte', '2026-02-01 23:59:59+00', true),
  ('DISCOUNT_5', 'discount_amount', 5, '5€ de réduction', '2026-02-01 23:59:59+00', true),
  ('DISCOUNT_10', 'discount_amount', 10, '10€ de réduction', '2026-02-01 23:59:59+00', true),
  ('DISCOUNT_15', 'discount_amount', 15, '15€ de réduction', '2026-02-01 23:59:59+00', true),
  ('DISCOUNT_20', 'discount_amount', 20, '20€ de réduction', '2026-02-01 23:59:59+00', true)
ON CONFLICT (code) DO NOTHING;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_is_used ON user_coupons(is_used);
CREATE INDEX IF NOT EXISTS idx_scratch_game_plays_user_id ON scratch_game_plays(user_id);