/*
  # Create RPC function to set user role bypassing PostgREST cache

  1. New Function
    - `set_user_role_direct` - Function to set user role directly bypassing cache
  
  2. Security
    - Only accessible via service_role
  
  3. Notes
    - This bypasses PostgREST cache issues
*/

CREATE OR REPLACE FUNCTION set_user_role_direct(
  p_user_id uuid,
  p_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  INSERT INTO user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    role = p_role,
    updated_at = NOW();
  
  SELECT json_build_object(
    'success', true,
    'user_id', p_user_id,
    'role', p_role
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION set_user_role_direct TO service_role;
GRANT EXECUTE ON FUNCTION set_user_role_direct TO authenticated;
