/*
  # Update Diamond Find Success Message
  
  1. Changes
    - Update the success message to be simpler and more direct
    - Message: "Super, vous avez trouvé un diamant caché ! Vous avez gagné 0.10 € !"
    
  2. Notes
    - This provides clearer feedback to users when they find a diamond
*/

-- Update the function to use the new message
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
  v_reward_amount numeric := 0.10;
  v_loyalty_points integer := 1;
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
  v_message := 'Super, vous avez trouvé un diamant caché ! Vous avez gagné 0.10 € !';

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
