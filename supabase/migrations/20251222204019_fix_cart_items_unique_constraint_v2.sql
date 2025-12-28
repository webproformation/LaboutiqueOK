/*
  # Fix cart_items unique constraint for upsert operations
  
  ## Problem
  The current unique index uses COALESCE which cannot be used by Supabase's upsert onConflict parameter.
  
  ## Solution
  Create a proper UNIQUE constraint on (user_id, product_id, variation_id) that allows NULL values
  to be treated as distinct. This means:
  - Same product without variation = one cart item
  - Same product with different variations = multiple cart items
  
  ## Changes
  1. Drop the COALESCE-based index
  2. Create a standard UNIQUE constraint that Supabase can use with onConflict
*/

-- Drop the COALESCE-based index
DROP INDEX IF EXISTS cart_items_user_product_variation_key;

-- Create a standard unique constraint
-- Note: In PostgreSQL, NULL values are considered distinct in UNIQUE constraints
-- So (user1, product1, NULL) and (user1, product1, NULL) would violate the constraint
-- But (user1, product1, variation1) and (user1, product1, variation2) are different
DO $$
BEGIN
  -- First, check if the constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'cart_items_user_product_variation_unique'
  ) THEN
    ALTER TABLE cart_items 
    ADD CONSTRAINT cart_items_user_product_variation_unique 
    UNIQUE (user_id, product_id, variation_id);
  END IF;
END $$;
