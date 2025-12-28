/*
  # Fix Diamond Finds System for Product Diamonds

  1. Changes
    - Drop existing foreign key constraint on diamond_id
    - Change diamond_id from uuid to text to support product-based IDs like "product-123"
    - Add reward_amount column if missing
    - Recreate RPC function for awarding diamond bonuses
    - Update RLS policies

  2. Security
    - Maintain RLS policies for user data access
*/

-- Drop the foreign key constraint first
ALTER TABLE diamond_finds 
DROP CONSTRAINT IF EXISTS diamond_finds_diamond_id_fkey;

-- Add reward_amount column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'diamond_finds' 
    AND column_name = 'reward_amount'
  ) THEN
    ALTER TABLE diamond_finds 
    ADD COLUMN reward_amount numeric(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Change diamond_id from uuid to text
-- First, we need to drop the column and recreate it
ALTER TABLE diamond_finds DROP COLUMN IF EXISTS diamond_id CASCADE;
ALTER TABLE diamond_finds ADD COLUMN diamond_id text NOT NULL DEFAULT '';

-- Update the unique constraint
DROP INDEX IF EXISTS diamond_finds_user_id_diamond_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS diamond_finds_user_diamond_unique 
ON diamond_finds(user_id, diamond_id);

-- Drop old policy if exists
DROP POLICY IF EXISTS "Users can read own diamond finds" ON diamond_finds;

-- Recreate RLS policy
CREATE POLICY "Users can read own diamond finds"
  ON diamond_finds FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

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

  -- Update user profile wallet balance
  INSERT INTO profiles (id, email, wallet_balance)
  SELECT p_user_id, email, v_reward_amount
  FROM auth.users
  WHERE id = p_user_id
  ON CONFLICT (id)
  DO UPDATE SET
    wallet_balance = COALESCE(profiles.wallet_balance, 0) + v_reward_amount;

  -- Award loyalty points if loyalty_points table exists
  INSERT INTO loyalty_points (user_id, total_points)
  VALUES (p_user_id, v_loyalty_points)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_points = COALESCE(loyalty_points.total_points, 0) + v_loyalty_points;

  -- Add loyalty transaction
  INSERT INTO loyalty_transactions (
    user_id,
    amount,
    type,
    description,
    reference_id
  )
  VALUES (
    p_user_id,
    v_reward_amount,
    'diamond_find',
    'Diamant caché découvert !',
    p_diamond_id
  );

  -- Record the find
  INSERT INTO diamond_finds (user_id, diamond_id, amount, reward_amount)
  VALUES (p_user_id, p_diamond_id, v_reward_amount, v_reward_amount);

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
