/*
  # Create Shipping Options System

  1. New Tables
    - `shipping_methods`
      - `id` (uuid, primary key)
      - `name` (text) - Nom de la méthode de livraison
      - `code` (text, unique) - Code unique de la méthode
      - `description` (text) - Description de la méthode
      - `cost` (decimal) - Prix de la livraison
      - `is_relay` (boolean) - Indique si c'est une livraison en point relais
      - `is_active` (boolean) - Indique si la méthode est active
      - `sort_order` (integer) - Ordre d'affichage
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `shipping_methods` table
    - Add policy for anonymous users to read active shipping methods
    - Add policy for authenticated admins to manage shipping methods
    
  3. Data
    - Insert default shipping methods with the provided rates:
      * Mondial Relay : 5,90 €
      * GLS Point Relais : 5,90 €
      * GLS Domicile : 7,90 €
      * Colissimo Domicile : 8,90 €
      * Chronopost (shop to shop) : 3,90 €
*/

-- Create shipping_methods table
CREATE TABLE IF NOT EXISTS shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text DEFAULT '',
  cost decimal(10,2) NOT NULL DEFAULT 0,
  is_relay boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

-- Policy for anonymous users to read active shipping methods
CREATE POLICY "Anyone can view active shipping methods"
  ON shipping_methods
  FOR SELECT
  USING (is_active = true);

-- Policy for authenticated admins to manage shipping methods
CREATE POLICY "Admins can manage shipping methods"
  ON shipping_methods
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

-- Insert default shipping methods with the provided rates
INSERT INTO shipping_methods (name, code, description, cost, is_relay, is_active, sort_order) VALUES
  ('Chronopost (shop to shop)', 'chronopost_relay', 'Livraison en point relais Chronopost - 24/48h', 3.90, true, true, 1),
  ('Mondial Relay', 'mondial_relay', 'Livraison en point relais Mondial Relay - 3 à 5 jours ouvrés', 5.90, true, true, 2),
  ('GLS Point Relais', 'gls_relay', 'Livraison en point relais GLS - 2 à 3 jours ouvrés', 5.90, true, true, 3),
  ('GLS Domicile', 'gls_home', 'Livraison à domicile par GLS - 2 à 3 jours ouvrés', 7.90, false, true, 4),
  ('Colissimo Domicile', 'colissimo_home', 'Livraison à domicile par Colissimo - 48h', 8.90, false, true, 5)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cost = EXCLUDED.cost,
  is_relay = EXCLUDED.is_relay,
  updated_at = now();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_shipping_methods_active ON shipping_methods(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shipping_methods_sort ON shipping_methods(sort_order);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_shipping_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS shipping_methods_updated_at ON shipping_methods;
CREATE TRIGGER shipping_methods_updated_at
  BEFORE UPDATE ON shipping_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_shipping_methods_updated_at();
