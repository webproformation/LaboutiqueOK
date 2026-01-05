/*
  # Système de Panier E-Commerce

  1. Nouvelles Tables
    - `cart_items` : Articles dans le panier de chaque utilisateur
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK vers auth.users)
      - `product_id` (text, ID du produit)
      - `product_name` (text)
      - `product_slug` (text)
      - `product_price` (text)
      - `product_image_url` (text)
      - `quantity` (integer)
      - `variation_id` (text, nullable)
      - `variation_data` (jsonb, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - Contrainte unique : (user_id, product_id, variation_id)

    - `shipping_methods` : Méthodes de livraison disponibles
      - `id` (text, primary key)
      - `method_id` (text)
      - `method_title` (text)
      - `method_description` (text)
      - `cost` (numeric)
      - `is_relay_point` (boolean)
      - `enabled` (boolean)
      - `sort_order` (integer)
      - `created_at` (timestamptz)

    - `orders` : Commandes clients
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK vers auth.users)
      - `order_number` (text, unique)
      - `status` (text : pending, processing, completed, shipped, cancelled)
      - `total_amount` (numeric)
      - `shipping_address` (jsonb)
      - `shipping_method_id` (text)
      - `shipping_cost` (numeric)
      - `tax_amount` (numeric)
      - `insurance_type` (text)
      - `insurance_cost` (numeric)
      - `wallet_amount_used` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `order_items` : Articles de chaque commande
      - `id` (uuid, primary key)
      - `order_id` (uuid, FK vers orders)
      - `product_name` (text)
      - `product_slug` (text)
      - `product_image` (text)
      - `price` (text)
      - `quantity` (integer)
      - `created_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies restrictives : users peuvent uniquement voir/modifier leurs propres données
    - shipping_methods : lecture publique pour méthodes actives uniquement
*/

-- Table cart_items
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_slug text NOT NULL,
  product_price text NOT NULL,
  product_image_url text,
  quantity integer NOT NULL DEFAULT 1,
  variation_id text,
  variation_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_cart_item UNIQUE NULLS NOT DISTINCT (user_id, product_id, variation_id)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cart"
  ON cart_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart items"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart items"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cart items"
  ON cart_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Table shipping_methods
CREATE TABLE IF NOT EXISTS shipping_methods (
  id text PRIMARY KEY,
  method_id text NOT NULL,
  method_title text NOT NULL,
  method_description text,
  cost numeric(10,2) NOT NULL DEFAULT 0,
  is_relay_point boolean DEFAULT false,
  enabled boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view enabled shipping methods"
  ON shipping_methods FOR SELECT
  USING (enabled = true);

-- Insérer les méthodes de livraison par défaut
INSERT INTO shipping_methods (id, method_id, method_title, method_description, cost, is_relay_point, enabled, sort_order)
VALUES
  ('colissimo', 'colissimo', 'Colissimo Domicile', 'Livraison à domicile sous 48-72h', 4.90, false, true, 1),
  ('mondial_relay', 'mondial_relay', 'Mondial Relay Point Relais', 'Retrait en point relais sous 3-5 jours', 3.50, true, true, 2),
  ('mondial_relay_locker', 'mondial_relay_locker', 'Mondial Relay Locker 24/7', 'Retrait en consigne automatique 24/7', 3.90, true, true, 3),
  ('free_shipping', 'free_shipping', 'Livraison Offerte', 'À partir de 50€ d''achat', 0, false, true, 0)
ON CONFLICT (id) DO NOTHING;

-- Table orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  order_number text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  total_amount numeric(10,2) NOT NULL,
  shipping_address jsonb NOT NULL,
  shipping_method_id text,
  shipping_cost numeric(10,2) DEFAULT 0,
  tax_amount numeric(10,2) DEFAULT 0,
  insurance_type text DEFAULT 'none',
  insurance_cost numeric(10,2) DEFAULT 0,
  wallet_amount_used numeric(10,2) DEFAULT 0,
  relay_point_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Table order_items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_name text NOT NULL,
  product_slug text NOT NULL,
  product_image text,
  price text NOT NULL,
  quantity integer NOT NULL,
  variation_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items from their orders"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
