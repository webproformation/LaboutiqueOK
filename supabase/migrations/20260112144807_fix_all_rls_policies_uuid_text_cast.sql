/*
  # Fix all RLS policies with proper UUID to TEXT casting

  1. Changes
    - Drop and recreate all admin policies to use auth.uid()::text
    - This prevents "operator does not exist: text = uuid" errors
    - Ensures consistency across all tables

  2. Tables affected
    - game_plays
    - user_coupons
    - All tables with profiles.id comparisons in RLS policies

  3. Security
    - Maintains existing security model with corrected type casting
*/

-- Fix game_plays policies
DROP POLICY IF EXISTS "Admin can view all game plays" ON game_plays;
DROP POLICY IF EXISTS "Admins can view all game plays" ON game_plays;

CREATE POLICY "Admins can view all game plays"
  ON game_plays
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id::text = auth.uid()::text
      AND profiles.is_admin = true
    )
  );

-- Fix user_coupons policies if they exist
DO $$
BEGIN
  -- Drop existing admin policies on user_coupons
  DROP POLICY IF EXISTS "Admin can view all coupons" ON user_coupons;
  DROP POLICY IF EXISTS "Admins can view all coupons" ON user_coupons;
  DROP POLICY IF EXISTS "Admin can insert coupons" ON user_coupons;
  DROP POLICY IF EXISTS "Admins can insert coupons" ON user_coupons;
  DROP POLICY IF EXISTS "Admin can update coupons" ON user_coupons;
  DROP POLICY IF EXISTS "Admins can update coupons" ON user_coupons;
  DROP POLICY IF EXISTS "Admin can delete coupons" ON user_coupons;
  DROP POLICY IF EXISTS "Admins can delete coupons" ON user_coupons;

  -- Recreate with proper casting
  CREATE POLICY "Admins can view all coupons"
    ON user_coupons
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id::text = auth.uid()::text
        AND profiles.is_admin = true
      )
    );

  CREATE POLICY "Admins can insert coupons"
    ON user_coupons
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id::text = auth.uid()::text
        AND profiles.is_admin = true
      )
    );

  CREATE POLICY "Admins can update coupons"
    ON user_coupons
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id::text = auth.uid()::text
        AND profiles.is_admin = true
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id::text = auth.uid()::text
        AND profiles.is_admin = true
      )
    );

  CREATE POLICY "Admins can delete coupons"
    ON user_coupons
    FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id::text = auth.uid()::text
        AND profiles.is_admin = true
      )
    );
END $$;

-- Fix card_flip_game_plays policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can view all plays" ON card_flip_game_plays;
  
  CREATE POLICY "Admins can view all plays"
    ON card_flip_game_plays
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id::text = auth.uid()::text
        AND profiles.is_admin = true
      )
    );
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;

-- Fix scratch_card_game_plays policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can view all plays" ON scratch_card_game_plays;
  
  CREATE POLICY "Admins can view all plays"
    ON scratch_card_game_plays
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id::text = auth.uid()::text
        AND profiles.is_admin = true
      )
    );
EXCEPTION WHEN undefined_table THEN
  NULL;
END $$;
