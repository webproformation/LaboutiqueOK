/*
  # Add client blocking and tracking fields to profiles

  1. Changes
    - Add `wordpress_user_id` (integer) - stores the WordPress user ID
    - Add `blocked` (boolean) - indicates if the user is blocked
    - Add `blocked_reason` (text) - reason for blocking
    - Add `blocked_at` (timestamptz) - when the user was blocked
    - Add `cancelled_orders_count` (integer) - tracks number of cancelled orders
    
  2. Notes
    - Users are automatically blocked after 3 cancelled orders
    - Admins can manually block/unblock users
    - WordPress user ID is synced during registration
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'wordpress_user_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN wordpress_user_id integer DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'blocked'
  ) THEN
    ALTER TABLE profiles ADD COLUMN blocked boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'blocked_reason'
  ) THEN
    ALTER TABLE profiles ADD COLUMN blocked_reason text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'blocked_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN blocked_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'cancelled_orders_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cancelled_orders_count integer DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_wordpress_user_id ON profiles(wordpress_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_blocked ON profiles(blocked);