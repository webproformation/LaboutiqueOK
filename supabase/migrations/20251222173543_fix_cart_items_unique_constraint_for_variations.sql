/*
  # Fix cart_items unique constraint to support product variations
  
  ## Changes
  
  1. **Drop old unique constraint**
     - Remove the constraint on (user_id, product_id) which doesn't account for variations
  
  2. **Add variation_id column**
     - Add a nullable text column to store the variation ID separately
     - This makes querying and uniqueness checking more efficient
  
  3. **Create new unique constraint**
     - Add constraint on (user_id, product_id, COALESCE(variation_id, ''))
     - This allows the same product with different variations to coexist
     - Empty string is used for products without variations
  
  ## Why this change?
  
  The original constraint didn't account for product variations, causing 409 conflicts
  when users added the same product with different sizes, colors, etc.
*/

-- Drop the old unique constraint
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;

-- Add variation_id column for better querying
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cart_items' AND column_name = 'variation_id'
  ) THEN
    ALTER TABLE cart_items ADD COLUMN variation_id text;
  END IF;
END $$;

-- Populate variation_id from variation_data for existing rows
UPDATE cart_items 
SET variation_id = variation_data->>'variationId'
WHERE variation_data IS NOT NULL AND variation_data->>'variationId' IS NOT NULL;

-- Create new unique constraint that includes variation_id
CREATE UNIQUE INDEX IF NOT EXISTS cart_items_user_product_variation_key 
  ON cart_items(user_id, product_id, COALESCE(variation_id, ''));

-- Add index on variation_id for better performance
CREATE INDEX IF NOT EXISTS idx_cart_items_variation_id ON cart_items(variation_id) WHERE variation_id IS NOT NULL;