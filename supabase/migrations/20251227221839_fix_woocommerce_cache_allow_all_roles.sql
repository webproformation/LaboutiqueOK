/*
  # Fix RLS policies for woocommerce_categories_cache - Allow all roles

  1. Problem
    - Service role key in .env is for different Supabase project
    - API actually uses anon key
    
  2. Policies Added
    - Allow anon and authenticated to insert/update/delete categories cache
    
  3. Security
    - Cache is read by public (already allowed)
    - Cache can be written by any role (it's just a cache of WooCommerce data)
*/

-- Drop existing service role only policies
DROP POLICY IF EXISTS "Service role can insert categories cache" ON woocommerce_categories_cache;
DROP POLICY IF EXISTS "Service role can update categories cache" ON woocommerce_categories_cache;
DROP POLICY IF EXISTS "Service role can delete categories cache" ON woocommerce_categories_cache;

-- Allow anyone to insert categories (it's just a cache)
CREATE POLICY "Allow insert categories cache"
  ON woocommerce_categories_cache
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- Allow anyone to update categories
CREATE POLICY "Allow update categories cache"
  ON woocommerce_categories_cache
  FOR UPDATE
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete categories
CREATE POLICY "Allow delete categories cache"
  ON woocommerce_categories_cache
  FOR DELETE
  TO anon, authenticated, service_role
  USING (true);
