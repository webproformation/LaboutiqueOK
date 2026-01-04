/*
  # Fix Trigger to Bypass RLS
  
  1. Changes
    - Grant trigger function ability to bypass RLS
    - Ensure trigger can create profiles regardless of RLS policies
    
  2. Security
    - Function is SECURITY DEFINER so it runs with owner privileges
    - Only triggers on INSERT to auth.users (controlled by Supabase)
*/

-- Recreate function with proper RLS bypass
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  role_inserted boolean := false;
  profile_inserted boolean := false;
BEGIN
  -- Insert user role (bypass RLS by using SECURITY DEFINER)
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer')
    ON CONFLICT (user_id) DO NOTHING;
    role_inserted := true;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to insert role for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Insert user profile (bypass RLS by using SECURITY DEFINER)
  BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    profile_inserted := true;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to insert profile for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Log success
  IF role_inserted AND profile_inserted THEN
    RAISE LOG 'Successfully created role and profile for user %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Grant execute permission to the service role
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO postgres;
