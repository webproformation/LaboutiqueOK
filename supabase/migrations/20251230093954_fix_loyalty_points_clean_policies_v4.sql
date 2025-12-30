/*
  # Clean and fix loyalty_points RLS policies
  
  1. Changes
    - Remove ALL existing policies on loyalty_points
    - Create clean, simple policies for anonymous and authenticated users
    - Allow service_role full access
  
  2. Security
    - Anonymous users can read all loyalty points (filtered client-side)
    - Authenticated users can read all loyalty points
    - Only service_role can insert/update/delete
*/

-- Drop ALL existing policies on loyalty_points
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'loyalty_points' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON loyalty_points', policy_record.policyname);
  END LOOP;
END $$;

-- Create simple, clean policies
CREATE POLICY "Allow all to read loyalty_points"
  ON loyalty_points
  FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

CREATE POLICY "Allow service_role to insert loyalty_points"
  ON loyalty_points
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Allow service_role to update loyalty_points"
  ON loyalty_points
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service_role to delete loyalty_points"
  ON loyalty_points
  FOR DELETE
  TO service_role
  USING (true);

-- Force PostgREST reload
NOTIFY pgrst, 'reload schema';
