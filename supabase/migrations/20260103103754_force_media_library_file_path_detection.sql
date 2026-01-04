/*
  # Force PostgREST to detect file_path column in media_library

  This migration forces PostgREST to reload the schema cache and recognize
  the file_path column that was manually added to media_library table.

  ## Actions
  1. Drop and recreate the unique constraint on url to trigger schema reload
  2. Add table comment to force cache invalidation
  3. Grant all necessary permissions
  4. Send NOTIFY signal to PostgREST
*/

-- Drop existing constraint
ALTER TABLE media_library DROP CONSTRAINT IF EXISTS media_library_url_key;

-- Recreate constraint (forces schema change)
ALTER TABLE media_library ADD CONSTRAINT media_library_url_key UNIQUE (url);

-- Update table comment (forces PostgREST cache refresh)
COMMENT ON TABLE media_library IS 'Media library storage - Updated for file_path column detection';

-- Ensure column exists (idempotent)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'media_library' 
    AND column_name = 'file_path'
  ) THEN
    ALTER TABLE media_library ADD COLUMN file_path text;
  END IF;
END $$;

-- Grant all permissions to ensure service_role can access
GRANT ALL ON media_library TO service_role;
GRANT ALL ON media_library TO authenticated;
GRANT SELECT ON media_library TO anon;

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
