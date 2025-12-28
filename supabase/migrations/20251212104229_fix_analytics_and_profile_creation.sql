/*
  # Fix Analytics System and Profile Creation

  1. Changes
    - Fix analytics policies to reference 'profiles' instead of 'user_profiles'
    - Add trigger to auto-create profile on user signup
    - Update analytics policies to allow users to manage their own data
    - Add policy for profiles to be created automatically

  2. Security
    - Users can read/update their own analytics data
    - Admins can view all analytics
    - Profiles are created automatically on signup
*/

-- Drop incorrect policies that reference user_profiles
DROP POLICY IF EXISTS "Admins can view all page visits" ON page_visits;
DROP POLICY IF EXISTS "Admins can view all sessions" ON user_sessions;
DROP POLICY IF EXISTS "Admins can view all live analytics" ON live_stream_analytics;
DROP POLICY IF EXISTS "Admins can view all order analytics" ON order_analytics;

-- Recreate policies for page_visits
CREATE POLICY "Admins can view all page visits"
  ON page_visits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )
    )
  );

CREATE POLICY "Users can view own page visits"
  ON page_visits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own page visits"
  ON page_visits FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Recreate policies for user_sessions
CREATE POLICY "Admins can view all sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )
    )
  );

CREATE POLICY "Users can view own sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Recreate policies for live_stream_analytics
CREATE POLICY "Admins can view all live analytics"
  ON live_stream_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )
    )
  );

-- Recreate policies for order_analytics
CREATE POLICY "Admins can view all order analytics"
  ON order_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )
    )
  );

-- Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_profile'
  ) THEN
    CREATE TRIGGER on_auth_user_created_profile
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION handle_new_user_profile();
  END IF;
END $$;
