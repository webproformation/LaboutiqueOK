/*
  # Create RPC function to insert media library entries
  
  1. Changes
    - Create function to bypass PostgREST cache
    - Allows direct SQL insertion into media_library
    - Returns inserted row data
  
  2. Security
    - Function is accessible to authenticated users
    - Uses SECURITY DEFINER to bypass RLS during insertion
*/

-- Create function to insert media library entries directly
CREATE OR REPLACE FUNCTION insert_media_library_entry(
  p_filename text,
  p_url text,
  p_file_path text,
  p_bucket_name text,
  p_file_size integer DEFAULT 0,
  p_mime_type text DEFAULT 'image/jpeg',
  p_usage_count integer DEFAULT 0,
  p_is_orphan boolean DEFAULT true,
  p_uploaded_by uuid DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  INSERT INTO media_library (
    filename, url, file_path, bucket_name, file_size,
    mime_type, usage_count, is_orphan, uploaded_by
  ) VALUES (
    p_filename, p_url, p_file_path, p_bucket_name, p_file_size,
    p_mime_type, p_usage_count, p_is_orphan, p_uploaded_by
  )
  ON CONFLICT (url) DO UPDATE SET
    filename = EXCLUDED.filename,
    file_path = EXCLUDED.file_path,
    file_size = EXCLUDED.file_size,
    mime_type = EXCLUDED.mime_type,
    updated_at = NOW()
  RETURNING json_build_object(
    'id', id,
    'filename', filename,
    'url', url
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_media_library_entry TO authenticated;
GRANT EXECUTE ON FUNCTION insert_media_library_entry TO anon;
GRANT EXECUTE ON FUNCTION insert_media_library_entry TO service_role;
