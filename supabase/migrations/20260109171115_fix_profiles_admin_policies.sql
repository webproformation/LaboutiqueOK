/*
  # Fix Admin Policies for Profiles Table

  1. Problem
    - Current RLS policies only allow users to manage their own profiles
    - Admins cannot modify other users' profiles (is_admin, blocked status)
    - Updates fail silently due to RLS restrictions

  2. Solution
    - Add admin-specific policies for SELECT, UPDATE, and DELETE
    - Allow admins to manage all profiles
    - Verify admin status using is_admin column

  3. Security
    - Policies check that the requesting user has is_admin = true
    - Only authenticated users can execute these operations
    - Maintains separation between regular users and admins
*/

-- Allow admins to read all profiles
CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Allow admins to insert profiles (for sync operations)
CREATE POLICY "Admins can insert profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
