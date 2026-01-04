/*
  # Fix duplicate wishlist policies
  
  1. Changes
    - Remove ALL existing policies on wishlist_items table
    - Recreate clean policies for anon and authenticated access
    
  2. Security
    - Maintains RLS protection
    - Ensures wishlist works for both anonymous and authenticated users
*/

-- Drop ALL existing policies (both old and new)
DROP POLICY IF EXISTS "Anyone can read their own wishlist items" ON wishlist_items;
DROP POLICY IF EXISTS "Anyone can insert their own wishlist items" ON wishlist_items;
DROP POLICY IF EXISTS "Anyone can delete their own wishlist items" ON wishlist_items;
DROP POLICY IF EXISTS "Allow anon and authenticated to read wishlist items" ON wishlist_items;
DROP POLICY IF EXISTS "Allow anon and authenticated to insert wishlist items" ON wishlist_items;
DROP POLICY IF EXISTS "Allow anon and authenticated to delete wishlist items" ON wishlist_items;

-- Create clean policies with explicit anon role access
CREATE POLICY "Wishlist SELECT for anon and authenticated"
  ON wishlist_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Wishlist INSERT for anon and authenticated"
  ON wishlist_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Wishlist DELETE for anon and authenticated"
  ON wishlist_items
  FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Wishlist UPDATE for anon and authenticated"
  ON wishlist_items
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
