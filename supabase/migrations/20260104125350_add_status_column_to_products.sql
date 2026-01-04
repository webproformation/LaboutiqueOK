/*
  # Add status column to products table

  1. Changes
    - Add `status` column to `products` table with values 'publish' or 'draft'
    - Set default value to 'publish'
    - Migrate existing `is_active` values to `status` column
    - Keep `is_active` column for backward compatibility

  2. Migration Steps
    - Add status column
    - Copy is_active values to status
    - Create index for better performance
*/

-- Add status column
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'publish';

-- Migrate existing is_active values to status
UPDATE products 
SET status = CASE 
  WHEN is_active = true THEN 'publish'
  ELSE 'draft'
END
WHERE status IS NULL OR status = 'publish';

-- Add check constraint to ensure only valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'products_status_check'
  ) THEN
    ALTER TABLE products 
    ADD CONSTRAINT products_status_check 
    CHECK (status IN ('publish', 'draft'));
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
