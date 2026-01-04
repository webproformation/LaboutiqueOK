/*
  # Add Admin Policies for Coupons and Slides Management

  1. Updates to Tables
    - `coupon_types` - Add admin policies for full management
    - `home_slides` - Add admin policies for full management

  2. Security Changes
    - Add policies for admins to create, update, and delete coupon types
    - Add policies for admins to create, update, and delete home slides
    - Ensure admins have full access to manage these resources

  3. Important Notes
    - Only users with 'admin' role in user_roles table can manage these resources
    - Regular authenticated users can only view active items
*/

-- Add admin policies for coupon_types
CREATE POLICY "Admins can insert coupon types"
  ON coupon_types FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update coupon types"
  ON coupon_types FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete coupon types"
  ON coupon_types FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all coupon types"
  ON coupon_types FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add admin policies for home_slides
CREATE POLICY "Admins can insert home slides"
  ON home_slides FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update home slides"
  ON home_slides FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete home slides"
  ON home_slides FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Anyone can view active home slides"
  ON home_slides FOR SELECT
  TO authenticated
  USING (
    is_active = true OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );