/*
  # Add Diamond and Featured Flags to Products

  1. Changes
    - Add `is_diamond` (boolean) column to products table
      - Default: false
      - Indicates if the product contains a hidden diamond game element
    
    - Add `is_featured` (boolean) column to products table
      - Default: false
      - Indicates if the product should appear in "Les coups de coeur de Morgane" section
      - When true, the product will be displayed on the homepage

  2. Notes
    - These columns help manage special product features
    - is_diamond: Used for the diamond treasure hunt game
    - is_featured: Replaces manual management in featured_products table
*/

-- Add is_diamond column to products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_diamond'
  ) THEN
    ALTER TABLE products ADD COLUMN is_diamond boolean DEFAULT false;
  END IF;
END $$;

-- Add is_featured column to products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE products ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
END $$;

-- Create index for featured products for faster queries
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true;

-- Create index for diamond products
CREATE INDEX IF NOT EXISTS idx_products_is_diamond ON products(is_diamond) WHERE is_diamond = true;