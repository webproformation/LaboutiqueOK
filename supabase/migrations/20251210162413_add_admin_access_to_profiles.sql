/*
  # Add Admin Access to Profiles

  1. Changes
    - Add policy for admins to read all profiles
    - Add policy for admins to update all profiles (needed for blocking/unblocking customers)

  2. Security
    - Uses existing is_admin() function to verify admin status
    - Only authenticated admins can access all profiles
    - Regular users still can only access their own profile

  3. Important Notes
    - This allows admin users to view and manage customer profiles
    - Essential for customer management features in admin dashboard
*/

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
  );

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.uid())
  )
  WITH CHECK (
    is_admin(auth.uid())
  );