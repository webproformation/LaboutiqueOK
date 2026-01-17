/*
  # Fix seo_metadata table by adding product_id column

  1. Changes
    - Add product_id column as TEXT to seo_metadata table
    - This allows the system to insert SEO data for products
    - The column is nullable since not all entities need SEO metadata
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'seo_metadata' 
    AND column_name = 'product_id'
  ) THEN
    ALTER TABLE seo_metadata 
    ADD COLUMN product_id TEXT NULL;
    
    -- Add foreign key to products
    ALTER TABLE seo_metadata
    ADD CONSTRAINT seo_metadata_product_id_fkey 
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
  END IF;
END $$;
