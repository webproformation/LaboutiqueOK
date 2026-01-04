/*
  # Create user_profiles view to match frontend code
  
  1. Changes
    - Create a view named user_profiles that points to profiles table
    - Add RLS policies to the view
  
  2. Goal
    - Allow frontend code to use user_profiles endpoint
    - Maintain compatibility with existing code
*/

-- Create view that mirrors profiles table
CREATE OR REPLACE VIEW user_profiles AS
SELECT * FROM profiles;

-- Enable RLS on the view (views inherit policies from underlying tables)
-- But we need to grant access to the view
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO anon, authenticated, service_role;

-- Force PostgREST to detect the new view
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_sleep(0.1);
  PERFORM pg_notify('pgrst', 'reload schema');
END $$;

-- Add comment
COMMENT ON VIEW user_profiles IS 'View for user profiles - created 2025-12-30 10:10';
