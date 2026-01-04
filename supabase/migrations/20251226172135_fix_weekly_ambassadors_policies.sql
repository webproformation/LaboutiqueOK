/*
  # Fix Weekly Ambassadors RLS Policies

  1. Changes
    - Replace is_admin() function calls with direct EXISTS queries
    - Ensure policies work correctly for anonymous users
    - Fix 406 errors on weekly_ambassadors table

  2. Security
    - Maintain admin-only access for INSERT/UPDATE
    - Allow public read access for active ambassadors
*/

-- Drop existing admin policies that use is_admin()
DROP POLICY IF EXISTS "Admins peuvent créer des ambassadrices" ON weekly_ambassadors;
DROP POLICY IF EXISTS "Admins peuvent modifier les ambassadrices" ON weekly_ambassadors;

-- Recreate with direct EXISTS queries instead of is_admin() function
CREATE POLICY "Admins can create ambassadors"
  ON weekly_ambassadors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update ambassadors"
  ON weekly_ambassadors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
