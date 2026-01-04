/*
  # Fix - Disable Wallet Creation Trigger

  1. Changes
    - Drop the create_wallet_on_user_creation trigger
    - This trigger was causing conflicts during user signup
    - Wallet balance is now managed in the profiles table directly

  2. Security
    - No security changes, just removing trigger
*/

-- Drop the wallet creation trigger
DROP TRIGGER IF EXISTS create_wallet_on_user_creation ON auth.users;

-- Verify no INSERT triggers remain on auth.users
DO $$
DECLARE
  trigger_count integer;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgrelid = 'auth.users'::regclass
    AND tgtype IN (5, 7)  -- AFTER INSERT or BEFORE INSERT
    AND tgname NOT LIKE 'RI_Constraint%';

  IF trigger_count = 0 THEN
    RAISE NOTICE 'All user creation triggers have been successfully disabled';
  ELSE
    RAISE WARNING '% user creation triggers still exist', trigger_count;
  END IF;
END $$;
