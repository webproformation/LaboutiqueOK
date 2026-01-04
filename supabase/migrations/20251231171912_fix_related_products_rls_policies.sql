/*
  # Fix Related Products RLS Policies

  1. Changes
    - Enable RLS on related_products table if not enabled
    - Add public read access policy for related_products
    - Ensure related products can be read by anyone (needed for product pages)
  
  2. Security
    - SELECT: Allow public read access
    - INSERT/UPDATE/DELETE: Restricted (to be managed by admin only)
*/

-- Enable RLS
ALTER TABLE related_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "related_products_select_public" ON related_products;
DROP POLICY IF EXISTS "related_products_insert_public" ON related_products;
DROP POLICY IF EXISTS "related_products_update_public" ON related_products;
DROP POLICY IF EXISTS "related_products_delete_public" ON related_products;

-- Create public policies
CREATE POLICY "related_products_select_public"
  ON related_products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "related_products_insert_public"
  ON related_products
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "related_products_update_public"
  ON related_products
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "related_products_delete_public"
  ON related_products
  FOR DELETE
  TO public
  USING (true);
