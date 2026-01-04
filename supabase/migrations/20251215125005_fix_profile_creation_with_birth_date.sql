/*
  # Fix Profile Creation with Birth Date
  
  1. Changes
    - Update trigger to include birth_date from user metadata
    - Ensure all user information is properly captured during signup
    
  2. Security
    - Function remains SECURITY DEFINER to bypass RLS
    - Only triggers on INSERT to auth.users (controlled by Supabase)
*/

-- Update function to include birth_date
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
  
  -- Insert user profile with all metadata (bypass RLS by using SECURITY DEFINER)
  BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, birth_date)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date
    )
    ON CONFLICT (id) DO UPDATE SET
      first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      birth_date = NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::date;
    profile_inserted := true;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to insert/update profile for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Log success
  IF role_inserted AND profile_inserted THEN
    RAISE LOG 'Successfully created role and profile for user %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure permissions are set
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO postgres;
