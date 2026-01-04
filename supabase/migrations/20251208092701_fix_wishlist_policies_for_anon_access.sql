/*
  # Fix wishlist policies for anonymous access
  
  1. Changes
    - Drop existing policies that don't properly support anonymous users
    - Create new policies that explicitly grant access to 'anon' role
    - Ensures wishlist functionality works for non-authenticated users
  
  2. Security
    - Maintains RLS protection
    - Grants appropriate access to anonymous users using the anon key
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read their own wishlist items" ON wishlist_items;
DROP POLICY IF EXISTS "Anyone can insert their own wishlist items" ON wishlist_items;
DROP POLICY IF EXISTS "Anyone can delete their own wishlist items" ON wishlist_items;

-- Create new policies with explicit anon role access
CREATE POLICY "Allow anon and authenticated to read wishlist items"
  ON wishlist_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow anon and authenticated to insert wishlist items"
  ON wishlist_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow anon and authenticated to delete wishlist items"
  ON wishlist_items
  FOR DELETE
  TO anon, authenticated
  USING (true);
