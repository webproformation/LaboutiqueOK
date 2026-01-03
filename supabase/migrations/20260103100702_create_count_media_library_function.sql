/*
  # Create RPC function to count media library entries
  
  1. Changes
    - Create function to count entries in media_library
    - Bypasses PostgREST cache issues
  
  2. Security
    - Accessible to all roles
*/

-- Create function to count media library entries
CREATE OR REPLACE FUNCTION count_media_library_entries()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count bigint;
BEGIN
  SELECT COUNT(*) INTO v_count FROM media_library;
  RETURN v_count;
END;
$$;

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION count_media_library_entries TO authenticated;
GRANT EXECUTE ON FUNCTION count_media_library_entries TO anon;
GRANT EXECUTE ON FUNCTION count_media_library_entries TO service_role;
