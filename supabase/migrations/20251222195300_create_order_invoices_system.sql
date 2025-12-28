/*
  # Create Order Invoices System

  1. New Tables
    - `order_invoices`
      - `id` (uuid, primary key) - Unique identifier for the invoice
      - `order_number` (text, not null) - WooCommerce order number
      - `woocommerce_order_id` (integer, not null) - WooCommerce order ID
      - `pdf_url` (text, not null) - URL to the generated PDF
      - `invoice_number` (text, not null, unique) - Formatted invoice number (e.g., FACT-2024-00001)
      - `customer_email` (text, not null) - Customer email for sending
      - `sent_at` (timestamptz) - When the invoice was sent by email
      - `generated_at` (timestamptz, default now()) - When the invoice was generated
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `order_invoices` table
    - Admin users can manage all invoices
    - Authenticated users can only view their own invoices

  3. Indexes
    - Index on order_number for quick lookups
    - Index on woocommerce_order_id for quick lookups
    - Index on invoice_number for quick lookups

  4. Functions
    - Function to generate invoice number automatically
    - Trigger to update updated_at timestamp
*/

-- Create order_invoices table
CREATE TABLE IF NOT EXISTS order_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text NOT NULL,
  woocommerce_order_id integer NOT NULL,
  pdf_url text NOT NULL,
  invoice_number text NOT NULL UNIQUE,
  customer_email text NOT NULL,
  sent_at timestamptz,
  generated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_invoices_order_number ON order_invoices(order_number);
CREATE INDEX IF NOT EXISTS idx_order_invoices_woocommerce_order_id ON order_invoices(woocommerce_order_id);
CREATE INDEX IF NOT EXISTS idx_order_invoices_invoice_number ON order_invoices(invoice_number);

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  year_num text;
  next_num integer;
  invoice_num text;
BEGIN
  year_num := to_char(now(), 'YYYY');
  
  -- Get the next number for this year
  SELECT COALESCE(MAX(
    CASE 
      WHEN invoice_number ~ ('^FACT-' || year_num || '-[0-9]+$')
      THEN CAST(substring(invoice_number from '[0-9]+$') AS integer)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM order_invoices
  WHERE invoice_number LIKE 'FACT-' || year_num || '-%';
  
  invoice_num := 'FACT-' || year_num || '-' || lpad(next_num::text, 5, '0');
  
  RETURN invoice_num;
END;
$$;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_order_invoices_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_order_invoices_updated_at ON order_invoices;
CREATE TRIGGER set_order_invoices_updated_at
  BEFORE UPDATE ON order_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_order_invoices_updated_at();

-- Enable RLS
ALTER TABLE order_invoices ENABLE ROW LEVEL SECURITY;

-- Policies for order_invoices
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

CREATE POLICY "Users can view their own invoices"
  ON order_invoices
  FOR SELECT
  TO authenticated
  USING (
    customer_email IN (
      SELECT email FROM profiles
      WHERE id = auth.uid()
    )
  );