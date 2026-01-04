/*
  # Fix media_library RLS and policies

  1. Security
    - Enable RLS on media_library table
    - Add policies for anonymous read access
    - Add policies for authenticated users to read/write
    - Add policies for service role to insert during sync

  2. Changes
    - Enable RLS on media_library
    - Create policy for public read access (needed for displaying images)
    - Create policy for authenticated insert/update/delete
    - Create policy for service role (used during sync)
*/

-- Enable RLS on media_library
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read media files (needed for displaying images)
CREATE POLICY "Anyone can view media files"
  ON media_library
  FOR SELECT
  USING (true);

-- Allow authenticated users to insert media files
CREATE POLICY "Authenticated users can insert media files"
  ON media_library
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update media files
CREATE POLICY "Authenticated users can update media files"
  ON media_library
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete media files
CREATE POLICY "Authenticated users can delete media files"
  ON media_library
  FOR DELETE
  TO authenticated
  USING (true);

-- Allow service role to insert during sync (bypass RLS)
-- Note: service_role bypasses RLS by default, but we add this for clarity
CREATE POLICY "Service role can manage all media files"
  ON media_library
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
