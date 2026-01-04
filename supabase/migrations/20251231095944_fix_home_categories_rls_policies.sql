/*
  # Fix Home Categories RLS Policies

  This migration adds permissive RLS policies for the home_categories table.

  ## Changes
  - Add SELECT policy for public access
  - Add INSERT, UPDATE, DELETE policies for service role
*/

-- Enable RLS if not already enabled
ALTER TABLE home_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "home_categories_select_public" ON home_categories;
DROP POLICY IF EXISTS "home_categories_insert_service" ON home_categories;
DROP POLICY IF EXISTS "home_categories_update_service" ON home_categories;
DROP POLICY IF EXISTS "home_categories_delete_service" ON home_categories;

-- Allow public read access
CREATE POLICY "home_categories_select_public"
  ON home_categories
  FOR SELECT
  TO public
  USING (true);

-- Allow service role to insert
CREATE POLICY "home_categories_insert_service"
  ON home_categories
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow service role to update
CREATE POLICY "home_categories_update_service"
  ON home_categories
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow service role to delete
CREATE POLICY "home_categories_delete_service"
  ON home_categories
  FOR DELETE
  TO public
  USING (true);
