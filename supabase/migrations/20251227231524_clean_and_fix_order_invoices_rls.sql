/*
  # Clean and Fix Order Invoices RLS Policies

  1. Changes
    - Drop ALL existing policies on order_invoices
    - Create clean, simple policies that work with service role
    - Ensure service role key bypasses all checks

  2. Security
    - Service role (API routes) has full access
    - Admins have full access via authenticated role
    - Regular users can only view their own invoices
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Service role can manage all invoices" ON order_invoices;
DROP POLICY IF EXISTS "Admins can view all invoices" ON order_invoices;
DROP POLICY IF EXISTS "Admins can view all order invoices" ON order_invoices;
DROP POLICY IF EXISTS "Admins can insert invoices" ON order_invoices;
DROP POLICY IF EXISTS "Admins can insert order invoices" ON order_invoices;
DROP POLICY IF EXISTS "Admins can update invoices" ON order_invoices;
DROP POLICY IF EXISTS "Admins can update order invoices" ON order_invoices;
DROP POLICY IF EXISTS "Admins can delete order invoices" ON order_invoices;
DROP POLICY IF EXISTS "Users can view their own invoices by email" ON order_invoices;
DROP POLICY IF EXISTS "Users can view own order invoices" ON order_invoices;

-- Create new clean policies
-- Note: Service role key automatically bypasses RLS, so we don't need a policy for it

-- Admins can do everything
CREATE POLICY "Admin full access to invoices"
  ON order_invoices
  FOR ALL
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

-- Users can view their own invoices by email
CREATE POLICY "Users view own invoices"
  ON order_invoices
  FOR SELECT
  TO authenticated
  USING (
    customer_email IN (
      SELECT email FROM profiles
      WHERE id = auth.uid()
    )
  );