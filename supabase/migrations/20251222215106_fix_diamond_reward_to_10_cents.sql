/*
  # Fix Diamond Reward Amount to 0.10 EUR
  
  1. Changes
    - Update the `award_diamond_find_bonus` function to award exactly 0.10 EUR per diamond
    - Previously awarded random amount between 5 EUR and 20 EUR
    - Now awards fixed 0.10 EUR per diamond found
    
  2. Notes
    - Loyalty points: 1 point per diamond (not based on amount)
    - Consistent reward for finding hidden diamonds across the site
*/

-- Drop existing function
DROP FUNCTION IF EXISTS award_diamond_find_bonus(uuid, text);

-- Create updated version with fixed 0.10 EUR reward
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
  v_reward_amount numeric := 0.10;  -- Fixed reward of 0.10 EUR
  v_loyalty_points integer := 1;     -- Fixed 1 point per diamond
  v_message text;
  v_user_email text;
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

  -- Get user email for profile creation
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;

  -- Update user profile wallet balance
  INSERT INTO profiles (id, email, wallet_balance)
  VALUES (p_user_id, v_user_email, v_reward_amount)
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
  v_message := 'Félicitations ! Vous avez trouvé un diamant caché !';

  RETURN jsonb_build_object(
    'success', true,
    'amount', v_reward_amount,
    'message', v_message,
    'loyalty_points', v_loyalty_points
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Erreur: ' || SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION award_diamond_find_bonus(uuid, text) TO authenticated;
