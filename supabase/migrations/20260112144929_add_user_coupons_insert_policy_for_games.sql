/*
  # Add INSERT policy for user_coupons from games

  1. Changes
    - Allow users to insert their own coupons (from games)
    - This enables game systems to award coupons to players
    
  2. Security
    - Users can only insert coupons for themselves
    - Verified by auth.uid() = user_id
*/

-- Add policy to allow users to insert their own coupons (from game rewards)
CREATE POLICY "Users can insert their own coupons"
  ON user_coupons
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
