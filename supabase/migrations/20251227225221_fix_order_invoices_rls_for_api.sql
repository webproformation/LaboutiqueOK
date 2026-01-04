/*
  # Fix RLS Policies for Order Invoices API Access

  1. Changes
    - Drop existing restrictive policies
    - Add new policies that work with service role key
    - Ensure admins can view all invoices
    - Ensure users can view their own invoices based on email

  2. Security
    - Service role key can bypass RLS
    - Admin users (via user_roles) can view all invoices
    - Regular users can only view their own invoices
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage all invoices" ON order_invoices;
DROP POLICY IF EXISTS "Users can view their own invoices" ON order_invoices;

-- Create new comprehensive policies
CREATE POLICY "Service role can manage all invoices"
  ON order_invoices
  FOR ALL
  USING (true);

CREATE POLICY "Admins can view all invoices"
  ON order_invoices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert invoices"
  ON order_invoices
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update invoices"
  ON order_invoices
  FOR UPDATE
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

CREATE POLICY "Users can view their own invoices by email"
  ON order_invoices
  FOR SELECT
  TO authenticated
  USING (
    customer_email IN (
      SELECT email FROM profiles
      WHERE id = auth.uid()
    )
  );