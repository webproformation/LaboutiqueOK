/*
  # Create Unified Media View

  1. Purpose
    - Create a unified view that combines media from the media table
    - Provides a single source of truth for all media files
    - Simplifies media queries across the application

  2. View Structure
    - id: Unique identifier
    - url: Public URL of the media file
    - filename: Original filename
    - file_size: Size in bytes
    - mime_type: Media type (image/jpeg, etc.)
    - created_at: Upload timestamp
    - source: Origin of the media (media_table)
*/

-- Create unified media view
CREATE OR REPLACE VIEW unified_media AS
SELECT
  id,
  url,
  filename,
  file_size,
  mime_type,
  created_at,
  'media_table' as source
FROM media
ORDER BY created_at DESC;

-- Grant access to the view
GRANT SELECT ON unified_media TO authenticated;
GRANT SELECT ON unified_media TO anon;
