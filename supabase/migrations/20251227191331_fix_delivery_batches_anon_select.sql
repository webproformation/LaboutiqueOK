/*
  # Fix delivery_batches anonymous access
  
  Allow anonymous users to query delivery_batches (will return empty results).
  This prevents 406 errors when the query runs before authentication.
*/

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view own delivery batches" ON delivery_batches;

-- Create a new SELECT policy that works for both authenticated and anonymous users
CREATE POLICY "Users can view own delivery batches"
  ON delivery_batches
  FOR SELECT
  TO authenticated, anon
  USING (
    CASE 
      WHEN auth.uid() IS NULL THEN false
      ELSE user_id = auth.uid()
    END
  );
