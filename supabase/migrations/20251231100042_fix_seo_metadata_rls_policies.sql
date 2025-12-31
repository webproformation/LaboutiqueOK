/*
  # Fix SEO Metadata RLS Policies

  This migration adds permissive RLS policies for the seo_metadata table.

  ## Changes
  - Enable RLS
  - Add SELECT, INSERT, UPDATE, DELETE policies for public access
*/

-- Enable RLS if not already enabled
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "seo_metadata_select_public" ON seo_metadata;
DROP POLICY IF EXISTS "seo_metadata_insert_public" ON seo_metadata;
DROP POLICY IF EXISTS "seo_metadata_update_public" ON seo_metadata;
DROP POLICY IF EXISTS "seo_metadata_delete_public" ON seo_metadata;

-- Allow public read access
CREATE POLICY "seo_metadata_select_public"
  ON seo_metadata
  FOR SELECT
  TO public
  USING (true);

-- Allow public to insert
CREATE POLICY "seo_metadata_insert_public"
  ON seo_metadata
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow public to update
CREATE POLICY "seo_metadata_update_public"
  ON seo_metadata
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Allow public to delete
CREATE POLICY "seo_metadata_delete_public"
  ON seo_metadata
  FOR DELETE
  TO public
  USING (true);
