/*
  # Force PostgREST reload for woocommerce_categories_cache table

  1. Problem
    - woocommerce_categories_cache table returns 404 errors
    - PostgREST cache doesn't recognize the table

  2. Solution
    - Add a temporary column to force schema change detection
    - Drop it immediately
    - Update table comment to force reload
    - Recreate RLS policies with new names
    - Send NOTIFY to PostgREST
*/

-- Add a temporary column to force schema change
ALTER TABLE woocommerce_categories_cache ADD COLUMN IF NOT EXISTS temp_reload BOOLEAN DEFAULT NULL;

-- Drop it immediately
ALTER TABLE woocommerce_categories_cache DROP COLUMN IF EXISTS temp_reload;

-- Update table comment with timestamp
COMMENT ON TABLE woocommerce_categories_cache IS 'WooCommerce categories cache - Force reload at 2025-12-30 20:35:00';

-- Update column comments
COMMENT ON COLUMN woocommerce_categories_cache.id IS 'Primary key - Updated 2025-12-30 20:35:00';
COMMENT ON COLUMN woocommerce_categories_cache.category_id IS 'WooCommerce category ID - Updated 2025-12-30 20:35:00';
COMMENT ON COLUMN woocommerce_categories_cache.name IS 'Category name - Updated 2025-12-30 20:35:00';

-- Drop all existing policies
DROP POLICY IF EXISTS "woocommerce_categories_cache_select_all" ON woocommerce_categories_cache;
DROP POLICY IF EXISTS "woocommerce_categories_cache_insert_all" ON woocommerce_categories_cache;
DROP POLICY IF EXISTS "woocommerce_categories_cache_update_all" ON woocommerce_categories_cache;
DROP POLICY IF EXISTS "woocommerce_categories_cache_delete_all" ON woocommerce_categories_cache;
DROP POLICY IF EXISTS "Allow public read access to categories cache" ON woocommerce_categories_cache;
DROP POLICY IF EXISTS "Allow service role to manage categories cache" ON woocommerce_categories_cache;

-- Create new policies with v2 suffix
CREATE POLICY "categories_cache_select_v2"
  ON woocommerce_categories_cache
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "categories_cache_insert_v2"
  ON woocommerce_categories_cache
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "categories_cache_update_v2"
  ON woocommerce_categories_cache
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "categories_cache_delete_v2"
  ON woocommerce_categories_cache
  FOR DELETE
  TO public
  USING (true);

-- Verify RLS is enabled
ALTER TABLE woocommerce_categories_cache ENABLE ROW LEVEL SECURITY;

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';
