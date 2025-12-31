/*
  # Fix Products Table Columns

  This migration fixes the products table to match the sync API expectations.

  ## Changes
  - Rename `price` to `regular_price` for consistency with WooCommerce
  - Rename `gallery_images` to `images` for consistency with sync code
  - Add `category_id` (foreign key to categories table)
  - Add `woocommerce_category_id` for storing WooCommerce category ID

  ## Notes
  - Existing data will be preserved during column renames
  - The `category_id` column will be nullable to allow products without categories
*/

-- Rename price to regular_price
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price'
  ) THEN
    ALTER TABLE products RENAME COLUMN price TO regular_price;
  END IF;
END $$;

-- Rename gallery_images to images
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'gallery_images'
  ) THEN
    ALTER TABLE products RENAME COLUMN gallery_images TO images;
  END IF;
END $$;

-- Add category_id column (foreign key to categories table)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add woocommerce_category_id column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'woocommerce_category_id'
  ) THEN
    ALTER TABLE products ADD COLUMN woocommerce_category_id integer;
  END IF;
END $$;

-- Create index on category_id for faster joins
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Create index on woocommerce_category_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_woocommerce_category_id ON products(woocommerce_category_id);

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';