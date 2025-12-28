/*
  # Add Hidden Diamond Flag to Featured Products
  
  1. Changes
    - Add `is_hidden_diamond` column to `featured_products` table
      - This flag indicates if the product has the hidden diamond functionality enabled
      - Default value is false
  
  2. Notes
    - This table now serves dual purpose:
      - `is_active`: marks products as featured (shown on homepage slider)
      - `is_hidden_diamond`: marks products with hidden diamond game enabled
*/

-- Add is_hidden_diamond column to featured_products table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'featured_products' 
    AND column_name = 'is_hidden_diamond'
  ) THEN
    ALTER TABLE featured_products 
    ADD COLUMN is_hidden_diamond boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Create index for faster queries on hidden diamond products
CREATE INDEX IF NOT EXISTS idx_featured_products_is_hidden_diamond 
ON featured_products(is_hidden_diamond);