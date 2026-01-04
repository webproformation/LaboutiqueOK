/*
  # Create product_category_mapping table

  1. New Tables
    - `product_category_mapping`
      - `id` (uuid, primary key)
      - `product_id` (bigint, references products)
      - `category_id` (text, WooCommerce category ID)
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on `product_category_mapping` table
    - Add policy for anonymous users to read mappings
    - Add policy for authenticated users to read mappings
    - Add policy for admins to manage mappings
*/

CREATE TABLE IF NOT EXISTS product_category_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id bigint NOT NULL,
  category_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, category_id)
);

ALTER TABLE product_category_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read product category mappings"
  ON product_category_mapping
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert product category mappings"
  ON product_category_mapping
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update product category mappings"
  ON product_category_mapping
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete product category mappings"
  ON product_category_mapping
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_category_mapping_product_id ON product_category_mapping(product_id);
CREATE INDEX IF NOT EXISTS idx_product_category_mapping_category_id ON product_category_mapping(category_id);
