/*
  # Create WooCommerce cache system

  1. New Tables
    - `woocommerce_categories_cache`
      - Stores cached categories from WooCommerce API
      - Updated periodically to reduce API calls
    - `woocommerce_products_cache`
      - Stores cached products from WooCommerce API
      - Updated periodically to reduce API calls

  2. Security
    - Enable RLS on both tables
    - Allow public read access (anonymous + authenticated)
    - Only service role can write (via API routes)
*/

-- Create woocommerce_categories_cache table
CREATE TABLE IF NOT EXISTS woocommerce_categories_cache (
  id BIGSERIAL PRIMARY KEY,
  category_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  image JSONB,
  count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create woocommerce_products_cache table
CREATE TABLE IF NOT EXISTS woocommerce_products_cache (
  id BIGSERIAL PRIMARY KEY,
  product_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  type TEXT DEFAULT 'simple',
  status TEXT DEFAULT 'publish',
  featured BOOLEAN DEFAULT false,
  catalog_visibility TEXT DEFAULT 'visible',
  description TEXT,
  short_description TEXT,
  sku TEXT,
  price TEXT,
  regular_price TEXT,
  sale_price TEXT,
  on_sale BOOLEAN DEFAULT false,
  categories JSONB,
  tags JSONB,
  images JSONB,
  attributes JSONB,
  variations JSONB,
  stock_status TEXT DEFAULT 'instock',
  stock_quantity INTEGER,
  meta_data JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE woocommerce_categories_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE woocommerce_products_cache ENABLE ROW LEVEL SECURITY;

-- Public read access for categories (anonymous + authenticated)
CREATE POLICY "Anyone can view cached categories"
  ON woocommerce_categories_cache
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Public read access for products (anonymous + authenticated)
CREATE POLICY "Anyone can view cached products"
  ON woocommerce_products_cache
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wc_categories_slug ON woocommerce_categories_cache(slug);
CREATE INDEX IF NOT EXISTS idx_wc_categories_parent ON woocommerce_categories_cache(parent);
CREATE INDEX IF NOT EXISTS idx_wc_products_slug ON woocommerce_products_cache(slug);
CREATE INDEX IF NOT EXISTS idx_wc_products_status ON woocommerce_products_cache(status);
CREATE INDEX IF NOT EXISTS idx_wc_products_featured ON woocommerce_products_cache(featured);
