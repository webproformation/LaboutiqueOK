/*
  # Fix woocommerce_categories_cache RLS policies
  
  1. Problem
    - RLS is enabled on woocommerce_categories_cache table
    - But NO policies exist, blocking all access
    - Categories cannot be loaded in admin interface
  
  2. Solution
    - Add SELECT policy for all roles (public cache data)
    - Add INSERT/UPDATE/DELETE policies for service_role (API sync)
  
  3. Security
    - Public read access (categories are public data)
    - Only service_role can modify cache
*/

-- Drop any existing policies first
DROP POLICY IF EXISTS "Anyone can read cached categories" ON woocommerce_categories_cache;
DROP POLICY IF EXISTS "Service role can insert categories cache" ON woocommerce_categories_cache;
DROP POLICY IF EXISTS "Service role can update categories cache" ON woocommerce_categories_cache;
DROP POLICY IF EXISTS "Service role can delete categories cache" ON woocommerce_categories_cache;

-- Allow everyone to read cached categories (public data)
CREATE POLICY "Anyone can read cached categories"
  ON woocommerce_categories_cache
  FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

-- Allow service_role to manage cache
CREATE POLICY "Service role can insert categories cache"
  ON woocommerce_categories_cache
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update categories cache"
  ON woocommerce_categories_cache
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can delete categories cache"
  ON woocommerce_categories_cache
  FOR DELETE
  TO service_role
  USING (true);

-- Force PostgREST cache reload
NOTIFY pgrst, 'reload schema';
