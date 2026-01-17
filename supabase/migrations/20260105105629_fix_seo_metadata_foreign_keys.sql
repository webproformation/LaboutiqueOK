/*
  # Fix seo_metadata foreign key constraints

  1. Changes
    - Drop invalid foreign key constraint referencing non-existent product_id column
    - The seo_metadata table uses entity_type and entity_identifier for polymorphic relationships
    - No direct foreign key to products table is needed
*/

-- Drop the problematic foreign key if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name LIKE '%seo_metadata%product%' 
    AND table_name = 'seo_metadata'
  ) THEN
    ALTER TABLE seo_metadata 
    DROP CONSTRAINT IF EXISTS seo_metadata_product_id_fkey;
  END IF;
END $$;
