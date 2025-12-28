/*
  # Fix Admin Policies Recursion Issues

  1. Changes
    - Drop policies that cause infinite recursion on coupon_types and home_slides
    - Recreate policies using the is_admin() function with SECURITY DEFINER
    - This prevents recursion by bypassing RLS when checking admin status

  2. Security
    - Admins can manage coupon_types and home_slides
    - Regular users can view active items only
*/

-- Drop and recreate coupon_types policies
DROP POLICY IF EXISTS "Admins can insert coupon types" ON coupon_types;
DROP POLICY IF EXISTS "Admins can update coupon types" ON coupon_types;
DROP POLICY IF EXISTS "Admins can delete coupon types" ON coupon_types;
DROP POLICY IF EXISTS "Admins can view all coupon types" ON coupon_types;

CREATE POLICY "Admins can insert coupon types"
  ON coupon_types FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update coupon types"
  ON coupon_types FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete coupon types"
  ON coupon_types FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all coupon types"
  ON coupon_types FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Drop and recreate home_slides policies
DROP POLICY IF EXISTS "Admins can insert home slides" ON home_slides;
DROP POLICY IF EXISTS "Admins can update home slides" ON home_slides;
DROP POLICY IF EXISTS "Admins can delete home slides" ON home_slides;
DROP POLICY IF EXISTS "Anyone can view active home slides" ON home_slides;

CREATE POLICY "Admins can insert home slides"
  ON home_slides FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update home slides"
  ON home_slides FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete home slides"
  ON home_slides FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Anyone can view active home slides"
  ON home_slides FOR SELECT
  TO authenticated
  USING (is_active = true OR is_admin(auth.uid()));