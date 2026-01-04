/*
  # Add is_featured and is_diamond columns to products table

  1. Changes
    - Add `is_featured` boolean column to `products` table
    - Add `is_diamond` boolean column to `products` table
    - Both default to false
    - Both are NOT NULL

  2. Purpose
    - Enable product-level featured/diamond status
    - Simplify featured products management (no more separate table)
    - Avoid 409 conflicts from duplicate inserts in featured_products table
*/

DO $$ 
BEGIN
  -- Add is_featured column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'is_featured'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN is_featured boolean DEFAULT false NOT NULL;
    
    RAISE NOTICE 'Column is_featured added to products table';
  ELSE
    RAISE NOTICE 'Column is_featured already exists';
  END IF;

  -- Add is_diamond column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'is_diamond'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN is_diamond boolean DEFAULT false NOT NULL;
    
    RAISE NOTICE 'Column is_diamond added to products table';
  ELSE
    RAISE NOTICE 'Column is_diamond already exists';
  END IF;
END $$;