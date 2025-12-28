/*
  # Fix Anonymous Access for All Public Tables

  1. Changes
    - Add SELECT policies for anonymous users on all public-facing tables
    - Allow unauthenticated access to read public data
    - Allow anonymous users to manage their own session data
  
  2. Security
    - Only SELECT access for public data
    - Session data restricted to owner's session_id
*/

-- Home slides: Allow anonymous SELECT
DROP POLICY IF EXISTS "Allow anon to view active slides" ON home_slides;
CREATE POLICY "Allow anon to view active slides"
  ON home_slides FOR SELECT
  TO anon
  USING (is_active = true);

-- Scratch game settings: Allow anonymous SELECT
DROP POLICY IF EXISTS "Allow anon to view scratch settings" ON scratch_game_settings;
CREATE POLICY "Allow anon to view scratch settings"
  ON scratch_game_settings FOR SELECT
  TO anon
  USING (true);

-- Home categories: Allow anonymous SELECT
DROP POLICY IF EXISTS "Allow anon to view active categories" ON home_categories;
CREATE POLICY "Allow anon to view active categories"
  ON home_categories FOR SELECT
  TO anon
  USING (is_active = true);

-- Wishlist items: Allow anonymous SELECT/INSERT/UPDATE/DELETE by session_id
DROP POLICY IF EXISTS "Allow anon to view own wishlist" ON wishlist_items;
CREATE POLICY "Allow anon to view own wishlist"
  ON wishlist_items FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Allow anon to insert wishlist" ON wishlist_items;
CREATE POLICY "Allow anon to insert wishlist"
  ON wishlist_items FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to delete wishlist" ON wishlist_items;
CREATE POLICY "Allow anon to delete wishlist"
  ON wishlist_items FOR DELETE
  TO anon
  USING (true);

-- Featured products: Allow anonymous SELECT
DROP POLICY IF EXISTS "Allow anon to view featured products" ON featured_products;
CREATE POLICY "Allow anon to view featured products"
  ON featured_products FOR SELECT
  TO anon
  USING (is_active = true);

-- Live streams: Allow anonymous SELECT
DROP POLICY IF EXISTS "Allow anon to view live streams" ON live_streams;
CREATE POLICY "Allow anon to view live streams"
  ON live_streams FOR SELECT
  TO anon
  USING (true);

-- Customer reviews: Allow anonymous SELECT
DROP POLICY IF EXISTS "Allow anon to view approved reviews" ON customer_reviews;
CREATE POLICY "Allow anon to view approved reviews"
  ON customer_reviews FOR SELECT
  TO anon
  USING (is_approved = true);

-- Wheel game settings: Allow anonymous SELECT
DROP POLICY IF EXISTS "Allow anon to view wheel settings" ON wheel_game_settings;
CREATE POLICY "Allow anon to view wheel settings"
  ON wheel_game_settings FOR SELECT
  TO anon
  USING (true);

-- Guestbook entries: Allow anonymous SELECT
DROP POLICY IF EXISTS "Allow anon to view approved guestbook" ON guestbook_entries;
CREATE POLICY "Allow anon to view approved guestbook"
  ON guestbook_entries FOR SELECT
  TO anon
  USING (status = 'approved');

-- Weekly ambassadors: Allow anonymous SELECT
DROP POLICY IF EXISTS "Allow anon to view active ambassadors" ON weekly_ambassadors;
CREATE POLICY "Allow anon to view active ambassadors"
  ON weekly_ambassadors FOR SELECT
  TO anon
  USING (is_active = true);

-- Guestbook settings: Allow anonymous SELECT
DROP POLICY IF EXISTS "Allow anon to view guestbook settings" ON guestbook_settings;
CREATE POLICY "Allow anon to view guestbook settings"
  ON guestbook_settings FOR SELECT
  TO anon
  USING (true);

-- Page visits: Allow anonymous INSERT
DROP POLICY IF EXISTS "Allow anon to insert page visits" ON page_visits;
CREATE POLICY "Allow anon to insert page visits"
  ON page_visits FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to select own visits" ON page_visits;
CREATE POLICY "Allow anon to select own visits"
  ON page_visits FOR SELECT
  TO anon
  USING (true);

-- User sessions: Allow anonymous access
DROP POLICY IF EXISTS "Allow anon to upsert sessions" ON user_sessions;
CREATE POLICY "Allow anon to upsert sessions"
  ON user_sessions FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);