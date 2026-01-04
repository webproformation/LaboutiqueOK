/*
  # Add RLS Policies for Order Invoices

  1. Changes
    - Add SELECT policy for admins to see all invoices
    - Add SELECT policy for users to see their own invoices (by email)
    - Add INSERT/UPDATE policies for admin operations

  2. Security
    - Users can only see invoices matching their profile email
    - Admins have full access
*/

-- Allow admins to see all invoices
CREATE POLICY "Admins can view all order invoices"
  ON order_invoices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Allow users to see their own invoices by email
CREATE POLICY "Users can view own order invoices"
  ON order_invoices FOR SELECT
  TO authenticated
  USING (
    customer_email IN (
      SELECT email FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Allow admins to insert invoices
CREATE POLICY "Admins can insert order invoices"
  ON order_invoices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Allow admins to update invoices
CREATE POLICY "Admins can update order invoices"
  ON order_invoices FOR UPDATE
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

-- Allow admins to delete invoices
CREATE POLICY "Admins can delete order invoices"
  ON order_invoices FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
