/*
  # Create Coupons Admin Table

  1. New Tables
    - `coupons`
      - `id` (uuid, primary key)
      - `coupon_type_id` (uuid, foreign key to coupon_types)
      - `code` (text, unique) - Code unique du coupon
      - `description` (text) - Description du coupon
      - `value` (numeric) - Valeur du coupon
      - `valid_until` (timestamptz) - Date d'expiration
      - `is_active` (boolean) - Statut actif/inactif
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `coupons` table
    - Admins can manage all coupons
    - Authenticated users can view active coupons

  3. Purpose
    - This table stores admin-created coupons that reference coupon_types
    - coupon_types = templates (e.g., "discount_amount", "discount_percentage", "free_delivery")
    - coupons = actual coupon instances (e.g., "PROMO10" using "discount_amount" type)
*/

-- Create coupons table if it doesn't exist
CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_type_id uuid REFERENCES coupon_types(id) ON DELETE CASCADE NOT NULL,
  code text UNIQUE NOT NULL,
  description text NOT NULL DEFAULT '',
  value numeric NOT NULL DEFAULT 0,
  valid_until timestamptz NOT NULL DEFAULT (now() + interval '1 year'),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
DROP POLICY IF EXISTS "Admins can view all coupons" ON coupons;
DROP POLICY IF EXISTS "Public can view active coupons" ON coupons;

-- Admin policies
CREATE POLICY "Admins can manage coupons"
  ON coupons
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Public can view active coupons
CREATE POLICY "Public can view active coupons"
  ON coupons
  FOR SELECT
  TO public
  USING (is_active = true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_coupons_coupon_type_id ON coupons(coupon_type_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON coupons
  FOR EACH ROW
  EXECUTE FUNCTION update_coupons_updated_at();
