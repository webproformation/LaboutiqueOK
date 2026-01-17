/*
  # Fix cart_items variation_id to NOT NULL with DEFAULT 'default'

  1. Changes
    - Update existing NULL variation_id values to 'default'
    - Alter variation_id column to NOT NULL with DEFAULT 'default'
    - Add unique constraint on (user_id, product_id, variation_id)

  2. Security
    - Maintains existing RLS policies

  3. Notes
    - This fixes the 409 conflict error when adding products without variations
    - Products without variations will use 'default' as variation_id
*/

-- Update existing NULL variation_id to 'default'
UPDATE cart_items
SET variation_id = 'default'
WHERE variation_id IS NULL;

-- Alter column to NOT NULL with DEFAULT
ALTER TABLE cart_items 
ALTER COLUMN variation_id SET DEFAULT 'default';

ALTER TABLE cart_items 
ALTER COLUMN variation_id SET NOT NULL;

-- Drop existing unique constraint if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'cart_items_user_product_variation_unique'
  ) THEN
    ALTER TABLE cart_items DROP CONSTRAINT cart_items_user_product_variation_unique;
  END IF;
END $$;

-- Create unique constraint on (user_id, product_id, variation_id)
ALTER TABLE cart_items
ADD CONSTRAINT cart_items_user_product_variation_unique 
UNIQUE (user_id, product_id, variation_id);
