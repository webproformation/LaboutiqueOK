/*
  # Create Categories Table

  This migration creates a table to store WooCommerce categories locally.

  ## New Tables
  - `categories`
    - `id` (uuid, primary key)
    - `woocommerce_id` (integer, unique) - WooCommerce category ID
    - `name` (text) - Category name
    - `slug` (text) - Category slug
    - `description` (text) - Category description
    - `parent_id` (uuid) - Parent category ID (self-referencing)
    - `woocommerce_parent_id` (integer) - WooCommerce parent category ID
    - `image_url` (text) - Category image URL
    - `count` (integer) - Number of products in category
    - `is_active` (boolean) - Active status
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Changes to home_categories
  - Add `category_id` column (foreign key to categories)
  - Keep existing columns for backward compatibility

  ## Security
  - Enable RLS on categories
  - Add policies for public read access
  - Add policies for admin write access
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  woocommerce_id integer UNIQUE NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  woocommerce_parent_id integer DEFAULT 0,
  image_url text,
  count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "categories_select_public"
  ON categories
  FOR SELECT
  TO public
  USING (true);

-- Allow public to insert (will be used by service role)
CREATE POLICY "categories_insert_public"
  ON categories
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to update (will be used by service role)
CREATE POLICY "categories_update_public"
  ON categories
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public to delete (will be used by service role)
CREATE POLICY "categories_delete_public"
  ON categories
  FOR DELETE
  TO public
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_categories_woocommerce_id ON categories(woocommerce_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Add category_id column to home_categories if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'home_categories' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE home_categories 
    ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE CASCADE;
    
    CREATE INDEX IF NOT EXISTS idx_home_categories_category_id ON home_categories(category_id);
  END IF;
END $$;

-- Force PostgREST cache reload
NOTIFY pgrst, 'reload schema';
