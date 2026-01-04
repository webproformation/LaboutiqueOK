/*
  # Add Wallet Balance to Profiles

  1. Changes
    - Add `wallet_balance` column to `profiles` table
    - Default value is 0
    - Used to store user's accumulated rewards and bonuses

  2. Notes
    - This wallet balance can be used as payment during checkout
    - Balance increases from various sources: diamond finds, daily bonuses, etc.
*/

-- Add wallet_balance column to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'wallet_balance'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN wallet_balance numeric(10, 2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_wallet_balance 
ON profiles(wallet_balance) WHERE wallet_balance > 0;
