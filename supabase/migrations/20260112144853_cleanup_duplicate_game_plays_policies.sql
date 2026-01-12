/*
  # Clean up duplicate game_plays policies

  1. Changes
    - Remove duplicate policies on game_plays table
    - Ensure single, clean set of policies with correct type handling
    
  2. Security
    - Users can insert and view their own game plays
    - Admins can view all game plays
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can insert own game plays" ON game_plays;
DROP POLICY IF EXISTS "Users can insert their own game plays" ON game_plays;
DROP POLICY IF EXISTS "Users can view own game plays" ON game_plays;
DROP POLICY IF EXISTS "Users can view their own game plays" ON game_plays;
DROP POLICY IF EXISTS "Admin can view all game plays" ON game_plays;
DROP POLICY IF EXISTS "Admins can view all game plays" ON game_plays;

-- Create clean, single set of policies
CREATE POLICY "Users can insert their own game plays"
  ON game_plays
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own game plays"
  ON game_plays
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

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
