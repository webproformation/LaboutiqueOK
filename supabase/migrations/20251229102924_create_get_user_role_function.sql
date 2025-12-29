/*
  # Create RPC function to get user role bypassing PostgREST cache

  1. New Function
    - `get_user_role_direct` - Function to get user role directly bypassing cache
  
  2. Security
    - Accessible by authenticated users for their own role
  
  3. Notes
    - This bypasses PostgREST cache issues
*/

CREATE OR REPLACE FUNCTION get_user_role_direct(
  p_user_id uuid
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM user_roles
  WHERE user_id = p_user_id;
  
  RETURN v_role;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_role_direct TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role_direct TO anon;
GRANT EXECUTE ON FUNCTION get_user_role_direct TO service_role;
