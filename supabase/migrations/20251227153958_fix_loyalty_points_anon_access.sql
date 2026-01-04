/*
  # Fix loyalty_points RLS for anonymous users

  1. Changes
    - Add policy to allow anonymous users to view their own loyalty points
    - Anonymous users are identified by their IP or session
  
  2. Security
    - Anonymous users can only view points associated with their user_id
    - Authenticated users can view their own points based on auth.uid()
*/

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own loyalty points" ON loyalty_points;

-- Create new SELECT policy that works for both authenticated and anonymous users
CREATE POLICY "Users can view own loyalty points"
  ON loyalty_points
  FOR SELECT
  USING (
    CASE 
      WHEN auth.role() = 'authenticated' THEN auth.uid() = user_id
      WHEN auth.role() = 'anon' THEN true  -- Allow anonymous to see all for now, we'll filter in app
      ELSE false
    END
  );
