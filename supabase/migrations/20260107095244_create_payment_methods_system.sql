/*
  # Création du système de méthodes de paiement

  1. Nouvelle table
    - payment_methods avec tous les champs nécessaires
  
  2. Sécurité
    - Enable RLS
    - Lecture publique pour méthodes actives
    - Gestion admin uniquement
*/

CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  icon text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  processing_fee_percentage numeric(5,2) DEFAULT 0,
  processing_fee_fixed numeric(10,2) DEFAULT 0,
  type text DEFAULT 'online' CHECK (type IN ('online', 'offline', 'wallet')),
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active payment methods"
  ON payment_methods
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Authenticated users can view all payment methods"
  ON payment_methods
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin can manage payment methods"
  ON payment_methods
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

INSERT INTO payment_methods (name, code, description, icon, is_active, sort_order, type, processing_fee_percentage, processing_fee_fixed) VALUES
  ('En boutique', 'in_store', 'Réglement en boutique lors du retrait de votre commande. Espèces, carte bancaire ou chèque acceptés.', '🏪', true, 1, 'offline', 0, 0),
  ('Virement bancaire', 'bank_transfer', 'Payez par virement bancaire. Votre commande sera traitée après réception du paiement.', '🏦', true, 2, 'offline', 0, 0),
  ('PayPal', 'paypal', 'Payez en toute sécurité avec votre compte PayPal.', '💳', true, 3, 'online', 3.4, 0.25),
  ('Stripe', 'stripe', 'Payez par carte bancaire de manière sécurisée via Stripe.', '💳', true, 4, 'online', 1.4, 0.25)
ON CONFLICT (code) DO NOTHING;
