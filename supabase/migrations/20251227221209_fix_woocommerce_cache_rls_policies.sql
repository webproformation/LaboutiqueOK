/*
  # Fix RLS policies for woocommerce_categories_cache

  1. Policies Added
    - Allow service role to insert categories into cache
    - Allow service role to update categories in cache
    - Allow service role to delete categories from cache

  2. Security
    - Public can only read (SELECT) - already exists
    - Only service role can write (INSERT/UPDATE/DELETE)
*/

-- Drop duplicate SELECT policy
DROP POLICY IF EXISTS "Anyone can view cached categories" ON woocommerce_categories_cache;

-- Service role can insert categories
CREATE POLICY "Service role can insert categories cache"
  ON woocommerce_categories_cache
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role can update categories
CREATE POLICY "Service role can update categories cache"
  ON woocommerce_categories_cache
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Service role can delete categories
CREATE POLICY "Service role can delete categories cache"
  ON woocommerce_categories_cache
  FOR DELETE
  TO service_role
  USING (true);
