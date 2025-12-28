/*
  # Fix User Signup - Add Missing Profile Fields

  1. Changes
    - Add wallet_balance field to profile creation
    - Add ambassador_badge field to profile creation
    - Ensure all profile fields have proper defaults

  2. Security
    - Function uses SECURITY DEFINER to bypass RLS
    - Only triggers on INSERT to auth.users (controlled by Supabase)
*/

-- Update the user signup function to include all fields
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  role_inserted boolean := false;
  profile_inserted boolean := false;
  session_inserted boolean := false;
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
      RAISE WARNING 'Failed to parse birth_date for user %: %. Setting to NULL.', NEW.id, SQLERRM;
      birth_date_value := NULL;
  END;

  -- Insert user role (bypass RLS by using SECURITY DEFINER)
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'customer')
    ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
    role_inserted := true;
    RAISE LOG 'Role created for user %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to insert role for user %: %. Continuing anyway.', NEW.id, SQLERRM;
  END;

  -- Insert user profile with ALL metadata fields (bypass RLS by using SECURITY DEFINER)
  BEGIN
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
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      birth_date_value,
      '',
      '',
      NULL,
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
      first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
      last_name = COALESCE(EXCLUDED.last_name, profiles.last_name),
      birth_date = COALESCE(EXCLUDED.birth_date, profiles.birth_date),
      updated_at = now();
    profile_inserted := true;
    RAISE LOG 'Profile created for user %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to insert/update profile for user %: %. Continuing anyway.', NEW.id, SQLERRM;
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
    DO UPDATE SET
      last_activity = now();
    session_inserted := true;
    RAISE LOG 'Analytics session created for user %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create analytics session for user %: %. Continuing anyway.', NEW.id, SQLERRM;
  END;

  -- Log final success status
  IF role_inserted AND profile_inserted THEN
    RAISE LOG 'Successfully created user % with role and profile', NEW.id;
  ELSIF role_inserted OR profile_inserted THEN
    RAISE WARNING 'Partially created user %: role=%, profile=%', NEW.id, role_inserted, profile_inserted;
  ELSE
    RAISE WARNING 'Failed to create role and profile for user %', NEW.id;
  END IF;

  -- ALWAYS return NEW to allow signup to complete
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Catch-all: log the error but NEVER prevent signup
    RAISE WARNING 'Unexpected error in handle_new_user_signup for user %: %. Signup will continue.', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Ensure proper permissions
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO service_role;
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO postgres;
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user_signup() TO anon;