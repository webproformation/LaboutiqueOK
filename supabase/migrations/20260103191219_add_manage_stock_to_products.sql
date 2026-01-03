/*
  # Add manage_stock column to products table

  1. Changes
    - Add `manage_stock` boolean column to `products` table
    - Default value: false (stock is not actively managed by default)
    - Nullable: false (always has a value)

  2. Purpose
    - Enable product-level stock management toggle
    - When true, the system will track stock_quantity
    - When false, product is always considered in stock
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'products' 
      AND column_name = 'manage_stock'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN manage_stock boolean DEFAULT false NOT NULL;
    
    RAISE NOTICE 'Column manage_stock added to products table';
  ELSE
    RAISE NOTICE 'Column manage_stock already exists';
  END IF;
END $$;