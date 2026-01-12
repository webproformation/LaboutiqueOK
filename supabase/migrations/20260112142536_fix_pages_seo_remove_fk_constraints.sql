/*
  # Remove foreign key constraints from pages_seo

  1. Changes
    - Drop foreign key constraints on created_by and updated_by
    - This allows converting these columns to TEXT for project consistency
    - We'll rely on RLS policies for data integrity instead

  2. Notes
    - Foreign keys to profiles are removed to allow TEXT IDs
    - RLS policies ensure only admins can modify pages
*/

-- Drop foreign key constraints if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pages_seo_created_by_fkey' 
    AND table_name = 'pages_seo'
  ) THEN
    ALTER TABLE pages_seo DROP CONSTRAINT pages_seo_created_by_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'pages_seo_updated_by_fkey' 
    AND table_name = 'pages_seo'
  ) THEN
    ALTER TABLE pages_seo DROP CONSTRAINT pages_seo_updated_by_fkey;
  END IF;
END $$;

-- Drop existing policies that we'll recreate
DROP POLICY IF EXISTS "Only admins can create pages" ON pages_seo;
DROP POLICY IF EXISTS "Only admins can update pages" ON pages_seo;
DROP POLICY IF EXISTS "Only admins can delete pages" ON pages_seo;

-- Convert created_by and updated_by to TEXT
ALTER TABLE pages_seo 
  ALTER COLUMN created_by TYPE text USING created_by::text;

ALTER TABLE pages_seo 
  ALTER COLUMN updated_by TYPE text USING updated_by::text;

-- Recreate RLS policies with proper type casting
CREATE POLICY "Only admins can create pages"
  ON pages_seo
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id::text = auth.uid()::text
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can update pages"
  ON pages_seo
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id::text = auth.uid()::text
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id::text = auth.uid()::text
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Only admins can delete pages"
  ON pages_seo
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id::text = auth.uid()::text
      AND profiles.is_admin = true
    )
  );
