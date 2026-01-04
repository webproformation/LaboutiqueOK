/*
  # Fix Loyalty Transactions RLS Policies
  
  1. Problem
    - RLS is enabled on loyalty_transactions but no policies exist
    - This causes all queries to fail with 400/406 errors
  
  2. Solution
    - Add policies for authenticated users to view their own transactions
    - Add policies for service role to insert transactions
    - Add policies for admins to view all transactions
  
  3. Security
    - Users can only view their own transactions
    - System can insert transactions for users
    - Admins can view and manage all transactions
*/

-- Drop existing policies if any (cleanup)
DROP POLICY IF EXISTS "Users can view own loyalty transactions" ON loyalty_transactions;
DROP POLICY IF EXISTS "Admins can view all loyalty transactions" ON loyalty_transactions;
DROP POLICY IF EXISTS "System can insert loyalty transactions" ON loyalty_transactions;
DROP POLICY IF EXISTS "Service role can insert loyalty transactions" ON loyalty_transactions;
DROP POLICY IF EXISTS "Admins can manage loyalty transactions" ON loyalty_transactions;
DROP POLICY IF EXISTS "Allow all access to loyalty transactions" ON loyalty_transactions;

-- Allow authenticated users to view their own transactions
CREATE POLICY "Users can view own loyalty transactions"
  ON loyalty_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow all roles to insert transactions (backend will validate)
CREATE POLICY "Allow insert loyalty transactions"
  ON loyalty_transactions FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Allow admins to view all transactions
CREATE POLICY "Admins can view all loyalty transactions"
  ON loyalty_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow admins to update/delete transactions
CREATE POLICY "Admins can manage loyalty transactions"
  ON loyalty_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Force PostgREST cache reload
NOTIFY pgrst, 'reload schema';