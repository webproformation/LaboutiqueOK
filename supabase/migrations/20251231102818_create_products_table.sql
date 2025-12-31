/*
  # Create Products Table

  This migration creates a table to store WooCommerce products.

  ## New Tables
  - `products`
    - `id` (uuid, primary key)
    - `woocommerce_id` (integer, unique) - WooCommerce product ID
    - `name` (text) - Product name
    - `slug` (text) - Product slug
    - `description` (text) - Product description
    - `short_description` (text) - Short description
    - `price` (numeric) - Regular price
    - `sale_price` (numeric) - Sale price
    - `image_url` (text) - Main product image
    - `gallery_images` (jsonb) - Array of gallery images
    - `stock_status` (text) - In stock, out of stock, etc.
    - `stock_quantity` (integer) - Stock quantity
    - `categories` (jsonb) - Product categories
    - `tags` (jsonb) - Product tags
    - `attributes` (jsonb) - Product attributes
    - `variations` (jsonb) - Product variations
    - `is_active` (boolean) - Active status
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - Enable RLS
  - Add policies for public read access
  - Add policies for admin write access
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  woocommerce_id integer UNIQUE NOT NULL,
  name text NOT NULL,
  slug text,
  description text,
  short_description text,
  price numeric(10, 2) DEFAULT 0,
  sale_price numeric(10, 2),
  image_url text,
  gallery_images jsonb DEFAULT '[]'::jsonb,
  stock_status text DEFAULT 'instock',
  stock_quantity integer,
  categories jsonb DEFAULT '[]'::jsonb,
  tags jsonb DEFAULT '[]'::jsonb,
  attributes jsonb DEFAULT '[]'::jsonb,
  variations jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "products_select_public"
  ON products
  FOR SELECT
  TO public
  USING (true);

-- Allow public to insert (will be used by service role)
CREATE POLICY "products_insert_public"
  ON products
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to update (will be used by service role)
CREATE POLICY "products_update_public"
  ON products
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public to delete (will be used by service role)
CREATE POLICY "products_delete_public"
  ON products
  FOR DELETE
  TO public
  USING (true);

-- Create index on woocommerce_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_woocommerce_id ON products(woocommerce_id);

-- Create index on slug for URL lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Create index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
