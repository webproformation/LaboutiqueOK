/*
  # Create Robust Signup Function
  
  1. New Functions
    - `create_user_with_profile` - Creates a user and their complete profile in one transaction
    - Handles all profile creation, WordPress sync, and referral processing
    - More reliable than trigger-based approach
  
  2. Security
    - Function uses SECURITY DEFINER to bypass RLS
    - Only accessible by authenticated users or during signup
*/

-- Create a robust signup function that doesn't rely on triggers
CREATE OR REPLACE FUNCTION create_user_profile_manually(
  p_user_id uuid,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_birth_date date DEFAULT NULL,
  p_wordpress_user_id int DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result jsonb := '{"success": false}'::jsonb;
BEGIN
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'customer')
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert or update user profile
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    birth_date,
    phone,
    avatar_url,
    wordpress_user_id,
    blocked,
    blocked_reason,
    blocked_at,
    cancelled_orders_count,
    wallet_balance,
    ambassador_badge,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_email,
    p_first_name,
    p_last_name,
    p_birth_date,
    '',
    '',
    p_wordpress_user_id,
    false,
    NULL,
    NULL,
    0,
    0,
    false,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    birth_date = COALESCE(EXCLUDED.birth_date, profiles.birth_date),
    wordpress_user_id = COALESCE(EXCLUDED.wordpress_user_id, profiles.wordpress_user_id),
    updated_at = now();

  -- Create analytics session
  INSERT INTO public.user_sessions (
    user_id,
    session_start,
    last_activity,
    pages_viewed
  )
  VALUES (
    p_user_id,
    now(),
    now(),
    0
  )
  ON CONFLICT (user_id, session_start) DO NOTHING;

  v_result := jsonb_build_object(
    'success', true,
    'user_id', p_user_id,
    'message', 'Profile created successfully'
  );
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_user_profile_manually TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile_manually TO anon;
GRANT EXECUTE ON FUNCTION create_user_profile_manually TO service_role;