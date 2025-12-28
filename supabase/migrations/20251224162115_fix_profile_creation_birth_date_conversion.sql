/*
  # Fix Profile Creation Birth Date Conversion
  
  1. Changes
    - Fix trigger to handle NULL birth_date values correctly
    - Use CASE statement for safer date conversion
    - Prevent errors when birth_date is not provided
    
  2. Security
    - Function remains SECURITY DEFINER to bypass RLS
    - Only triggers on INSERT to auth.users (controlled by Supabase)
*/

-- Update function to safely handle birth_date conversion
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  role_inserted boolean := false;
  profile_inserted boolean := false;
  birth_date_value date := NULL;
BEGIN
  -- Safely convert birth_date from metadata
  BEGIN
    IF NEW.raw_user_meta_data ? 'birth_date' AND 
       NEW.raw_user_meta_data->>'birth_date' IS NOT NULL AND 
       NEW.raw_user_meta_data->>'birth_date' != '' THEN
      birth_date_value := (NEW.raw_user_meta_data->>'birth_date')::date;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to parse birth_date for user %: %', NEW.id, SQLERRM;
      birth_date_value := NULL;
  END;

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
      birth_date_value
    )
    ON CONFLICT (id) DO UPDATE SET
      first_name = COALESCE(NEW.raw_user_meta_data->>'first_name', profiles.first_name),
      last_name = COALESCE(NEW.raw_user_meta_data->>'last_name', profiles.last_name),
      birth_date = COALESCE(birth_date_value, profiles.birth_date);
    profile_inserted := true;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to insert/update profile for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Insert analytics session record (bypass RLS by using SECURITY DEFINER)
  BEGIN
    INSERT INTO public.user_sessions (
      user_id,
      session_start,
      last_activity,
      pages_viewed
    )
    VALUES (
      NEW.id,
      now(),
      now(),
      0
    )
    ON CONFLICT (user_id, session_start) 
    DO UPDATE SET last_activity = now();
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create analytics session for user %: %', NEW.id, SQLERRM;
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

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();
