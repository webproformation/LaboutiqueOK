/*
  # Add Performance Indexes

  1. Indexes for Frequently Queried Tables
    - Add indexes on home_slides for faster carousel loading
    - Add indexes on live_streams for faster replay queries
    - Add indexes on featured_products for faster product queries
    - Add indexes on home_categories for faster category loading
    - Add indexes on profiles for faster user lookups
    - Add indexes on orders for faster order history
    - Add indexes on loyalty_transactions for faster points calculations

  2. Composite Indexes
    - Add composite indexes for common query patterns
    - Optimize joins and filtered queries

  3. Notes
    - All indexes include conditions where applicable to reduce index size
*/

-- Home slides indexes
CREATE INDEX IF NOT EXISTS idx_home_slides_active_order
  ON home_slides (is_active, order_position)
  WHERE is_active = true;

-- Live streams indexes
CREATE INDEX IF NOT EXISTS idx_live_streams_replay
  ON live_streams (status, created_at DESC)
  WHERE status IN ('completed', 'ended') AND replay_url IS NOT NULL;

-- Featured products indexes
CREATE INDEX IF NOT EXISTS idx_featured_products_active_order
  ON featured_products (is_active, display_order)
  WHERE is_active = true;

-- Home categories indexes
CREATE INDEX IF NOT EXISTS idx_home_categories_active_order
  ON home_categories (is_active, display_order)
  WHERE is_active = true;

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON profiles (email);

CREATE INDEX IF NOT EXISTS idx_profiles_wordpress_id
  ON profiles (wordpress_user_id)
  WHERE wordpress_user_id IS NOT NULL;

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_date
  ON orders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_order_number
  ON orders (order_number);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON order_items (order_id);

-- Loyalty transactions indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user_date
  ON loyalty_transactions (user_id, created_at DESC);

-- Wishlist indexes
CREATE INDEX IF NOT EXISTS idx_wishlist_items_session
  ON wishlist_items (session_id);

-- Addresses indexes
CREATE INDEX IF NOT EXISTS idx_addresses_user_id
  ON addresses (user_id);

-- Scratch game plays indexes
CREATE INDEX IF NOT EXISTS idx_scratch_plays_user_date
  ON scratch_game_plays (user_id, played_at DESC);

-- Wheel game plays indexes
CREATE INDEX IF NOT EXISTS idx_wheel_plays_user_date
  ON wheel_game_plays (user_id, created_at DESC);

-- User sessions indexes (analytics)
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id
  ON user_sessions (session_id);

-- Page visits indexes (analytics)
CREATE INDEX IF NOT EXISTS idx_page_visits_session_date
  ON page_visits (session_id, visited_at DESC);

-- Cookie consent indexes
CREATE INDEX IF NOT EXISTS idx_cookie_consents_user_date
  ON cookie_consents (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Newsletter subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_email
  ON newsletter_subscriptions (email)
  WHERE is_active = true;

-- Contact messages indexes
CREATE INDEX IF NOT EXISTS idx_contact_messages_status_date
  ON contact_messages (status, created_at DESC);
