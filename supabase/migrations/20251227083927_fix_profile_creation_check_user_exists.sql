/*
  # Fix Profile Creation - Check User Exists First

  1. Changes
    - Update create_user_profile_manually to verify user exists in auth.users
    - Add better error handling and logging
    - Only proceed if user exists

  2. Security
    - Function uses SECURITY DEFINER to bypass RLS
    - Proper permissions maintained
*/

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
  v_user_exists boolean;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_user_id
  ) INTO v_user_exists;

  IF NOT v_user_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User does not exist in auth.users',
      'detail', 'User must be created in auth.users before calling this function'
    );
  END IF;

  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'customer')
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role;

  -- Insert or update user profile with ALL required fields
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
    0.00,
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

  -- Create wallet_credits entry
  INSERT INTO public.wallet_credits (user_id, balance)
  VALUES (p_user_id, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

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
    RAISE WARNING 'Error in create_user_profile_manually for user %: % (SQLSTATE: %)', p_user_id, SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_user_profile_manually TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile_manually TO anon;
GRANT EXECUTE ON FUNCTION create_user_profile_manually TO service_role;
