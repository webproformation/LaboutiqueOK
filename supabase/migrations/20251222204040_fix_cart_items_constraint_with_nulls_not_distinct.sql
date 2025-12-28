/*
  # Fix cart_items unique constraint to handle NULL variations properly
  
  ## Problem
  PostgreSQL treats NULL values as distinct in UNIQUE constraints by default.
  This means multiple rows with (user1, product1, NULL) would be allowed,
  which is not what we want for cart items.
  
  ## Solution
  Use PostgreSQL 15's NULLS NOT DISTINCT feature in the unique constraint.
  This treats NULL values as equal to each other.
  
  ## Changes
  1. Drop the previous constraint
  2. Create a new constraint with NULLS NOT DISTINCT
*/

-- Drop the previous constraint
ALTER TABLE cart_items DROP CONSTRAINT IF EXISTS cart_items_user_product_variation_unique;

-- Create a unique constraint that treats NULLs as equal
-- This requires PostgreSQL 15+, which Supabase provides
ALTER TABLE cart_items 
ADD CONSTRAINT cart_items_user_product_variation_unique 
UNIQUE NULLS NOT DISTINCT (user_id, product_id, variation_id);
