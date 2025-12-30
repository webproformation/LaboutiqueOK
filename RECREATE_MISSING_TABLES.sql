-- ============================================================================
-- MEGA SCRIPT: RECRÉER TOUTES LES TABLES MANQUANTES
-- Base: qcqbtmvbvipsxwjlgjvk
-- Date: 2024-12-29
-- ============================================================================
-- À EXÉCUTER DANS SUPABASE SQL EDITOR
-- ============================================================================

-- 1. ORDERS ET ORDER_ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  status text DEFAULT 'pending',
  total_amount numeric(10, 2) DEFAULT 0,
  shipping_address jsonb DEFAULT '{}',
  woocommerce_order_id text,
  stripe_payment_intent_id text,
  payment_method text,
  payment_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  product_slug text NOT NULL,
  product_image text DEFAULT '',
  price text NOT NULL,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to orders" ON orders;
CREATE POLICY "Allow all access to orders" ON orders FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to order_items" ON order_items;
CREATE POLICY "Allow all access to order_items" ON order_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. CART_ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_slug text NOT NULL,
  product_price text NOT NULL,
  product_image_url text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  variation_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT cart_items_unique_product UNIQUE NULLS NOT DISTINCT (user_id, product_id, variation_data)
);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to cart_items" ON cart_items;
CREATE POLICY "Allow all access to cart_items" ON cart_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);

-- 3. WISHLIST_ITEMS
-- ============================================================================
CREATE TABLE IF NOT EXISTS wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  product_slug text NOT NULL,
  product_name text NOT NULL,
  product_image text,
  product_price text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to wishlist_items" ON wishlist_items;
CREATE POLICY "Allow all access to wishlist_items" ON wishlist_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_wishlist_session_id ON wishlist_items(session_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_session_product ON wishlist_items(session_id, product_slug);

-- 4. WALLET & RETURNS
-- ============================================================================
CREATE TABLE IF NOT EXISTS wallet_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance numeric(10,2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid REFERENCES wallet_credits(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('credit_return', 'debit_order', 'refund', 'admin_adjustment', 'diamond_find')),
  reference_id text,
  description text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  woocommerce_order_id text NOT NULL,
  return_type text NOT NULL CHECK (return_type IN ('credit', 'refund')),
  status text DEFAULT 'declared' NOT NULL CHECK (status IN ('declared', 'received', 'finalized')),
  total_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
  loyalty_points_to_deduct numeric(10,2) DEFAULT 0.00,
  gift_value_deducted numeric(10,2) DEFAULT 0.00,
  gift_returned boolean DEFAULT false,
  notes text,
  declared_at timestamptz DEFAULT now(),
  received_at timestamptz,
  finalized_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid REFERENCES returns(id) ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  quantity integer DEFAULT 1 NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) DEFAULT 0.00 NOT NULL,
  discount_amount numeric(10,2) DEFAULT 0.00,
  net_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
  loyalty_points_generated numeric(10,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wallet_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to wallet_credits" ON wallet_credits;
CREATE POLICY "Allow all access to wallet_credits" ON wallet_credits FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to wallet_transactions" ON wallet_transactions;
CREATE POLICY "Allow all access to wallet_transactions" ON wallet_transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to returns" ON returns;
CREATE POLICY "Allow all access to returns" ON returns FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to return_items" ON return_items;
CREATE POLICY "Allow all access to return_items" ON return_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. LOYALTY SYSTEM
-- ============================================================================
CREATE TABLE IF NOT EXISTS loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  points numeric(10,2) DEFAULT 0.00 NOT NULL,
  lifetime_points numeric(10,2) DEFAULT 0.00 NOT NULL,
  tier text DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  points numeric(10,2) NOT NULL,
  type text NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'bonus', 'adjustment')),
  description text NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  points_required numeric(10,2) NOT NULL,
  reward_type text NOT NULL CHECK (reward_type IN ('discount', 'product', 'free_shipping')),
  reward_value numeric(10,2),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS loyalty_rewards_unlocked (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reward_id uuid REFERENCES loyalty_rewards(id) ON DELETE CASCADE NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  used_at timestamptz,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL
);

ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards_unlocked ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to loyalty_points" ON loyalty_points;
CREATE POLICY "Allow all access to loyalty_points" ON loyalty_points FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to loyalty_transactions" ON loyalty_transactions;
CREATE POLICY "Allow all access to loyalty_transactions" ON loyalty_transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to loyalty_rewards" ON loyalty_rewards;
CREATE POLICY "Allow all access to loyalty_rewards" ON loyalty_rewards FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to loyalty_rewards_unlocked" ON loyalty_rewards_unlocked;
CREATE POLICY "Allow all access to loyalty_rewards_unlocked" ON loyalty_rewards_unlocked FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. HOME CATEGORIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS home_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id text NOT NULL,
  category_name text NOT NULL,
  category_slug text NOT NULL,
  image_url text,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE home_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to home_categories" ON home_categories;
CREATE POLICY "Allow all access to home_categories" ON home_categories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 7. FEATURED PRODUCTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS featured_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL UNIQUE,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_hidden_diamond boolean DEFAULT false,
  diamond_reward_amount numeric(10,2) DEFAULT 0.10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE featured_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to featured_products" ON featured_products;
CREATE POLICY "Allow all access to featured_products" ON featured_products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 8. LIVE STREAMING
-- ============================================================================
CREATE TABLE IF NOT EXISTS live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  stream_url text,
  thumbnail_url text,
  replay_url text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_stream_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES live_streams(id) ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_stream_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES live_streams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username text NOT NULL,
  avatar_url text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS live_stream_viewers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES live_streams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz
);

CREATE TABLE IF NOT EXISTS live_stream_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES live_streams(id) ON DELETE CASCADE NOT NULL,
  total_viewers integer DEFAULT 0,
  peak_concurrent_viewers integer DEFAULT 0,
  average_watch_time_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_stream_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_stream_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_stream_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to live_streams" ON live_streams;
CREATE POLICY "Allow all access to live_streams" ON live_streams FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to live_stream_products" ON live_stream_products;
CREATE POLICY "Allow all access to live_stream_products" ON live_stream_products FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to live_stream_chat_messages" ON live_stream_chat_messages;
CREATE POLICY "Allow all access to live_stream_chat_messages" ON live_stream_chat_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to live_stream_viewers" ON live_stream_viewers;
CREATE POLICY "Allow all access to live_stream_viewers" ON live_stream_viewers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to live_stream_analytics" ON live_stream_analytics;
CREATE POLICY "Allow all access to live_stream_analytics" ON live_stream_analytics FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 9. CLIENT MEASUREMENTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  height integer,
  weight integer,
  shoe_size text,
  preferred_size_top text,
  preferred_size_bottom text,
  bust_measurement integer,
  waist_measurement integer,
  hip_measurement integer,
  preferred_fit text,
  style_preferences text[],
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE client_measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to client_measurements" ON client_measurements;
CREATE POLICY "Allow all access to client_measurements" ON client_measurements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 10. ANALYTICS TABLES
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  ip_address text,
  user_agent text,
  referrer text,
  landing_page text,
  exit_page text
);

CREATE TABLE IF NOT EXISTS page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  page_path text NOT NULL,
  page_title text,
  visited_at timestamptz DEFAULT now(),
  time_spent_seconds integer DEFAULT 0
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to user_sessions" ON user_sessions;
CREATE POLICY "Allow all access to user_sessions" ON user_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access to page_visits" ON page_visits;
CREATE POLICY "Allow all access to page_visits" ON page_visits FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 11. ORDER INVOICES
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invoice_number text UNIQUE NOT NULL,
  invoice_url text,
  generated_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to order_invoices" ON order_invoices;
CREATE POLICY "Allow all access to order_invoices" ON order_invoices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 12. DIAMOND FINDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS diamond_finds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL,
  reward_amount numeric(10,2) DEFAULT 0.10 NOT NULL,
  found_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE diamond_finds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to diamond_finds" ON diamond_finds;
CREATE POLICY "Allow all access to diamond_finds" ON diamond_finds FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- FORCER LE RECHARGEMENT DU CACHE POSTGREST
-- ============================================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Créer une table temporaire pour forcer le rechargement
DROP TABLE IF EXISTS _force_reload_mega_script CASCADE;
CREATE TABLE _force_reload_mega_script (id serial PRIMARY KEY, reloaded_at timestamptz DEFAULT now());
DROP TABLE _force_reload_mega_script CASCADE;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
SELECT 'Script terminé - Tables créées avec succès!' as message;
