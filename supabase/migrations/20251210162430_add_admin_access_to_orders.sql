/*
  # Add Admin Access to Orders

  1. Changes
    - Add policy for admins to read all orders
    - Add policy for admins to update all orders
    - Add policy for admins to read all order items

  2. Security
    - Uses existing is_admin() function to verify admin status
    - Only authenticated admins can access all orders
    - Regular users still can only access their own orders

  3. Important Notes
    - This allows admin users to view and manage all customer orders
    - Essential for order management and customer support features in admin dashboard
*/

-- Allow admins to read all orders
CREATE POLICY "Admins can read all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
  );

-- Allow admins to update all orders
CREATE POLICY "Admins can update all orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (
    is_admin(auth.uid())
  )
  WITH CHECK (
    is_admin(auth.uid())
  );

-- Allow admins to read all order items
CREATE POLICY "Admins can read all order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (
    is_admin(auth.uid())
  );