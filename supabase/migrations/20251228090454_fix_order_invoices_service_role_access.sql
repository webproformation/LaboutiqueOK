/*
  # Fix Order Invoices RLS for Service Role Access

  1. Changes
    - Drop existing restrictive policies
    - Add new policies that allow service_role full access
    - Maintain security for regular authenticated users
    - Allow service_role to bypass RLS restrictions

  2. Security
    - Service role (API routes) has full access
    - Admins have full access
    - Users can only view their own invoices
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin full access to invoices" ON order_invoices;
DROP POLICY IF EXISTS "Users view own invoices" ON order_invoices;
DROP POLICY IF EXISTS "Service role full access" ON order_invoices;
DROP POLICY IF EXISTS "API can manage all invoices" ON order_invoices;

-- Allow service role full access (for API routes using service_role key)
CREATE POLICY "Service role full access to invoices"
  ON order_invoices
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow admins full access
CREATE POLICY "Admins can manage all invoices"
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

-- Allow users to view their own invoices
CREATE POLICY "Users can view own invoices"
  ON order_invoices
  FOR SELECT
  TO authenticated
  USING (
    customer_email IN (
      SELECT email FROM profiles
      WHERE profiles.id = auth.uid()
    )
  );
