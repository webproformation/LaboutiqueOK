/*
  # Fix Game Settings RLS for Anonymous Access

  ## Summary
  Corrects Row Level Security policies for game settings tables to allow anonymous users
  to read game configuration even when games are disabled.

  ## Changes Made

  ### `scratch_game_settings`
  - Already has correct policy for anonymous access

  ### `wheel_game_settings`
  - Drop restrictive policy that only allows viewing enabled settings
  - Add new policy allowing anonymous and authenticated users to view all settings

  ### `pending_prizes`
  - Already has correct policies

  ## Security
  - Anonymous users can read game settings (needed for popup display logic)
  - Only admins can modify game settings
  - No sensitive data is exposed by allowing read access to game settings

  ## Notes
  - This fixes 406 errors when anonymous users try to load game settings
  - The frontend needs to check `is_enabled` status before showing games
*/

-- Drop the restrictive policy for wheel_game_settings
DROP POLICY IF EXISTS "Anyone can view enabled wheel game settings" ON wheel_game_settings;

-- Create a new policy that allows anyone to view all settings
CREATE POLICY "Anyone can view wheel game settings"
  ON wheel_game_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Ensure scratch_game_settings allows anonymous access (should already exist)
-- This is just to be safe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'scratch_game_settings'
    AND policyname = 'Anyone can view scratch game settings'
  ) THEN
    CREATE POLICY "Anyone can view scratch game settings"
      ON scratch_game_settings FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;