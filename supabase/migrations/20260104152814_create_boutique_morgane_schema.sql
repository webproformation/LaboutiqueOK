/*
  # Create La Boutique de Morgane Schema
  
  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `wallet_balance` (numeric, default 0) - Points de fidélité
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `loyalty_tiers`
      - `id` (uuid, primary key)
      - `name` (text) - ex: Bronze, Silver, Gold
      - `min_points` (integer) - Points minimum requis
      - `discount_percentage` (numeric) - Pourcentage de réduction
      - `created_at` (timestamptz)
    
    - `product_categories`
      - `id` (uuid, primary key)
      - `name` (text) - Nom de la catégorie
      - `slug` (text, unique) - URL-friendly identifier
      - `description` (text)
      - `image_url` (text)
      - `created_at` (timestamptz)
    
    - `products`
      - `product_id` (text, primary key) - WordPress ID comme "466252"
      - `name` (text)
      - `description` (text)
      - `price` (numeric)
      - `image_url` (text)
      - `stock` (integer, default 0)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `product_category_mapping`
      - `product_id` (text, references products)
      - `category_id` (uuid, references product_categories)
      - Primary key: (product_id, category_id)
    
    - `home_categories`
      - `id` (uuid, primary key)
      - `category_id` (uuid, references product_categories)
      - `display_order` (integer)
      - `is_featured` (boolean, default false)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Public read access for products and categories
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  wallet_balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  min_points integer NOT NULL DEFAULT 0,
  discount_percentage numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
  product_id text PRIMARY KEY,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  image_url text DEFAULT '',
  stock integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_category_mapping (
  product_id text REFERENCES products(product_id) ON DELETE CASCADE,
  category_id uuid REFERENCES product_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);

CREATE TABLE IF NOT EXISTS home_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES product_categories(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_category_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for product_categories"
  ON product_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Public read access for product_category_mapping"
  ON product_category_mapping FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for home_categories"
  ON home_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for loyalty_tiers"
  ON loyalty_tiers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

INSERT INTO loyalty_tiers (name, min_points, discount_percentage) VALUES
  ('Bronze', 0, 0),
  ('Silver', 1000, 5),
  ('Gold', 5000, 10),
  ('Platinum', 10000, 15)
ON CONFLICT DO NOTHING;
