/*
  # Create Featured Products Table

  1. New Tables
    - `featured_products`
      - `id` (uuid, primary key)
      - `product_id` (integer) - WooCommerce product ID
      - `display_order` (integer) - Order in which products appear in the slider
      - `is_active` (boolean) - Whether the product should be shown
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `featured_products` table
    - Add policy for public to read active featured products
    - Add policies for admins to manage featured products
*/

CREATE TABLE IF NOT EXISTS featured_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id integer NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE featured_products ENABLE ROW LEVEL SECURITY;

-- Public can view active featured products
CREATE POLICY "Anyone can view active featured products"
  ON featured_products
  FOR SELECT
  USING (is_active = true);

-- Function to check if user is admin (reuse existing function)
-- Admins can view all featured products
CREATE POLICY "Admins can view all featured products"
  ON featured_products
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins can insert featured products
CREATE POLICY "Admins can insert featured products"
  ON featured_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins can update featured products
CREATE POLICY "Admins can update featured products"
  ON featured_products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admins can delete featured products
CREATE POLICY "Admins can delete featured products"
  ON featured_products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_featured_products_display_order ON featured_products(display_order);
CREATE INDEX IF NOT EXISTS idx_featured_products_is_active ON featured_products(is_active);
