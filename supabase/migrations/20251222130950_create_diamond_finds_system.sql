/*
  # Create Diamond Finds System

  1. New Tables
    - `diamond_finds`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `diamond_id` (text, identifier for the diamond location/product)
      - `found_at` (timestamptz, when the diamond was found)
      - `reward_amount` (numeric, amount awarded in euros)
      - Tracks which diamonds each user has found

  2. Functions
    - `award_diamond_find_bonus`: Awards bonus when user finds a hidden diamond
      - Checks if user already found this specific diamond
      - Awards bonus to wallet
      - Records the find
      - Awards loyalty points

  3. Security
    - Enable RLS on `diamond_finds` table
    - Users can read their own finds
    - Only system can insert new finds (via RPC function)
*/

-- Create diamond_finds table
CREATE TABLE IF NOT EXISTS diamond_finds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  diamond_id text NOT NULL,
  found_at timestamptz DEFAULT now(),
  reward_amount numeric(10, 2) NOT NULL DEFAULT 0,
  UNIQUE(user_id, diamond_id)
);

-- Enable RLS
ALTER TABLE diamond_finds ENABLE ROW LEVEL SECURITY;

-- Users can read their own diamond finds
CREATE POLICY "Users can read own diamond finds"
  ON diamond_finds FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_diamond_finds_user_id ON diamond_finds(user_id);
CREATE INDEX IF NOT EXISTS idx_diamond_finds_diamond_id ON diamond_finds(diamond_id);

-- Function to award diamond find bonus
CREATE OR REPLACE FUNCTION award_diamond_find_bonus(
  p_user_id uuid,
  p_diamond_id text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_find uuid;
  v_reward_amount numeric;
  v_loyalty_points integer;
  v_current_wallet numeric;
  v_message text;
BEGIN
  -- Check if user already found this diamond
  SELECT id INTO v_existing_find
  FROM diamond_finds
  WHERE user_id = p_user_id AND diamond_id = p_diamond_id;

  IF v_existing_find IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Vous avez déjà trouvé ce diamant !'
    );
  END IF;

  -- Random reward between 5 and 20 euros
  v_reward_amount := (5 + random() * 15)::numeric(10, 2);

  -- Award loyalty points (1 point per euro)
  v_loyalty_points := v_reward_amount::integer;

  -- Get current wallet balance
  SELECT COALESCE(wallet_balance, 0) INTO v_current_wallet
  FROM user_profiles
  WHERE user_id = p_user_id;

  -- Update wallet balance
  INSERT INTO user_profiles (user_id, wallet_balance)
  VALUES (p_user_id, v_reward_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET
    wallet_balance = COALESCE(user_profiles.wallet_balance, 0) + v_reward_amount;

  -- Award loyalty points
  INSERT INTO loyalty_points (user_id, points, earned_at, source, description)
  VALUES (
    p_user_id,
    v_loyalty_points,
    now(),
    'diamond_find',
    'Diamant caché découvert !'
  );

  -- Record the find
  INSERT INTO diamond_finds (user_id, diamond_id, reward_amount)
  VALUES (p_user_id, p_diamond_id, v_reward_amount);

  -- Generate congratulatory message
  v_message := 'Bravo ! Vous avez trouvé un diamant caché !';

  RETURN jsonb_build_object(
    'success', true,
    'amount', v_reward_amount,
    'message', v_message,
    'loyalty_points', v_loyalty_points
  );
END;
$$;
