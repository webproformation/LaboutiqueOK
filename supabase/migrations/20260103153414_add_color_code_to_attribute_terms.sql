/*
  # Add color_code column to product_attribute_terms

  1. Changes
    - Add `color_code` column to store hex color codes for color attributes
    - This enables proper color swatch display in admin interface
  
  2. Notes
    - color_code is nullable (only used for color-type attributes)
    - Format: #RRGGBB (e.g., #FF5733, #00FF00)
*/

-- Add color_code column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_attribute_terms' AND column_name = 'color_code'
  ) THEN
    ALTER TABLE product_attribute_terms 
    ADD COLUMN color_code text;
    
    RAISE NOTICE 'Added color_code column to product_attribute_terms';
  ELSE
    RAISE NOTICE 'color_code column already exists';
  END IF;
END $$;
