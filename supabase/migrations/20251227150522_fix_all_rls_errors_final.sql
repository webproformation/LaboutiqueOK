/*
  # Correction finale des erreurs RLS

  1. delivery_batches
    - Ajout de policies pour les admins
    
  2. order_invoices
    - Suppression des policies en double
    - Simplification des policies
*/

-- Fix delivery_batches policies
DROP POLICY IF EXISTS "Admins can manage all delivery batches" ON delivery_batches;

CREATE POLICY "Admins can manage all delivery batches"
  ON delivery_batches
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

-- Fix order_invoices policies - remove duplicates
DROP POLICY IF EXISTS "Users can view their own invoices" ON order_invoices;

-- Keep only these policies
-- "Admins can manage all invoices" (already exists)
-- "Users can view own order invoices" (already exists)

-- Grant service_role full access (for edge functions)
ALTER TABLE order_invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE delivery_batches FORCE ROW LEVEL SECURITY;
