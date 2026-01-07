/*
  # Add is_visible column to categories table

  1. Changes
    - Add `is_visible` boolean column to categories table
    - Default value is true (all categories visible by default)
    - Update all existing categories to visible

  2. Security
    - No RLS changes needed (existing policies apply)
*/

-- Add is_visible column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories'
    AND column_name = 'is_visible'
  ) THEN
    ALTER TABLE categories
    ADD COLUMN is_visible boolean DEFAULT true NOT NULL;

    -- Set all existing categories to visible
    UPDATE categories SET is_visible = true;

    -- Add index for better query performance
    CREATE INDEX IF NOT EXISTS idx_categories_is_visible ON categories(is_visible);
  END IF;
END $$;
