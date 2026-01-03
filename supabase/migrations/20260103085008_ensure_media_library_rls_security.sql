/*
  # Ensure media_library RLS Security

  1. Security Review
    - Verify RLS is enabled on media_library
    - Clean duplicate or conflicting policies
    - Set strict RLS policies following best practices

  2. RLS Policies
    - SELECT: Public access (anyone can view images)
    - INSERT/UPDATE/DELETE: Authenticated users only
    - Service role bypasses RLS by default (no explicit policy needed)

  3. Changes
    - Drop existing policies to avoid duplicates
    - Recreate clean policies with proper security
*/

-- Enable RLS on media_library (idempotent)
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "Anyone can view media files" ON media_library;
DROP POLICY IF EXISTS "Authenticated users can insert media files" ON media_library;
DROP POLICY IF EXISTS "Authenticated users can update media files" ON media_library;
DROP POLICY IF EXISTS "Authenticated users can delete media files" ON media_library;
DROP POLICY IF EXISTS "Service role can manage all media files" ON media_library;
DROP POLICY IF EXISTS "Public read access" ON media_library;
DROP POLICY IF EXISTS "Auth insert access" ON media_library;
DROP POLICY IF EXISTS "Auth update access" ON media_library;
DROP POLICY IF EXISTS "Auth delete access" ON media_library;

-- CREATE CLEAN POLICIES

-- SELECT: Allow everyone to view media files (needed for displaying images on public pages)
CREATE POLICY "Public can view all media files"
  ON media_library
  FOR SELECT
  USING (true);

-- INSERT: Only authenticated users can upload media
CREATE POLICY "Authenticated users can insert media"
  ON media_library
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Only authenticated users can update media metadata
CREATE POLICY "Authenticated users can update media"
  ON media_library
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: Only authenticated users can delete media
CREATE POLICY "Authenticated users can delete media"
  ON media_library
  FOR DELETE
  TO authenticated
  USING (true);

-- Note: service_role bypasses RLS automatically, no explicit policy needed
