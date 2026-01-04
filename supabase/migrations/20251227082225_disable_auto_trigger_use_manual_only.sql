/*
  # Disable Auto Trigger - Use Manual Profile Creation Only

  1. Changes
    - Completely disable the automatic trigger
    - Rely only on manual profile creation from the app
    - This prevents double-insertion conflicts

  2. Security
    - Functions use SECURITY DEFINER to bypass RLS
    - Proper permissions granted to necessary roles

  3. Important Notes
    - Profile creation is now 100% controlled by the application
    - No automatic triggers will fire on user signup
    - This prevents conflicts and gives better error handling
*/

-- Drop ALL existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_unified ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

-- Keep the functions but don't use them as triggers
-- This way we can still call them manually if needed

-- Ensure the manual creation function has all required fields
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
    RAISE WARNING 'Error in create_user_profile_manually for user %: %', p_user_id, SQLERRM;
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

-- Verify no triggers exist
DO $$
DECLARE
  trigger_count integer;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname IN ('on_auth_user_created', 'on_auth_user_created_unified', 'on_auth_user_created_profile')
    AND tgrelid = 'auth.users'::regclass;

  IF trigger_count = 0 THEN
    RAISE NOTICE 'All automatic user creation triggers have been disabled successfully';
  ELSE
    RAISE WARNING '% automatic triggers still exist', trigger_count;
  END IF;
END $$;
