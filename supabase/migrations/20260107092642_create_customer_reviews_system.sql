/*
  # Système d'Avis Clientes

  1. Nouvelles Tables
    - `customer_reviews` - Avis des clientes
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable, foreign key to auth.users)
      - `order_id` (uuid, nullable, foreign key to orders)
      - `customer_name` (text) - Nom de la cliente
      - `customer_email` (text) - Email
      - `rating` (integer) - Note sur 5
      - `comment` (text) - Commentaire
      - `photo_url` (text, nullable) - Photo optionnelle
      - `status` (text) - 'pending', 'approved', 'rejected'
      - `is_featured` (boolean) - Mis en avant sur homepage
      - `created_at` (timestamptz)
      - `approved_at` (timestamptz, nullable)

  2. Sécurité
    - RLS activé
    - Public peut créer des avis
    - Seuls les avis approuvés sont visibles publiquement
    - Admins peuvent tout gérer
*/

CREATE TABLE IF NOT EXISTS customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL CHECK (char_length(comment) >= 10 AND char_length(comment) <= 1000),
  photo_url text,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  approved_at timestamptz,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_status ON customer_reviews(status);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_rating ON customer_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_featured ON customer_reviews(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_customer_reviews_user_id ON customer_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_order_id ON customer_reviews(order_id);

ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved reviews"
  ON customer_reviews FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Users can create reviews"
  ON customer_reviews FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all reviews"
  ON customer_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update reviews"
  ON customer_reviews FOR UPDATE
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

CREATE POLICY "Admins can delete reviews"
  ON customer_reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_customer_reviews_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_customer_reviews_timestamp
  BEFORE UPDATE ON customer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_reviews_updated_at();
