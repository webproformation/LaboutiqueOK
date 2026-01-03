/*
  # Force PostgREST Cache Reload for media_library
  
  1. Changes
    - Force PostgREST to reload the media_library schema
    - Add comment to trigger schema cache refresh
    - Send NOTIFY signal to PostgREST
  
  2. Notes
    - Fixes PGRST204 error
    - Forces schema cache invalidation
*/

-- Add comment to force schema change detection
COMMENT ON TABLE media_library IS 'Media library for centralized asset management - Updated 2026-01-03';

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Ensure RLS is enabled
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to recreate them fresh
DROP POLICY IF EXISTS "Public read access to media library" ON media_library;
DROP POLICY IF EXISTS "Authenticated users can insert media" ON media_library;
DROP POLICY IF EXISTS "Authenticated users can update media" ON media_library;
DROP POLICY IF EXISTS "Authenticated users can delete media" ON media_library;

-- Recreate policies with correct permissions
CREATE POLICY "Public read access to media library"
  ON media_library
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert media"
  ON media_library
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update media"
  ON media_library
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete media"
  ON media_library
  FOR DELETE
  TO authenticated
  USING (true);
