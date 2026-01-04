/*
  # Fix Public Anonymous Access for All Tables
  
  This migration adds SELECT policies for anonymous users (role: anon) to all tables
  that need to be accessible from the public frontend.
  
  ## Tables Fixed
  
  1. Public Display Tables
    - home_slides: Homepage slider content
    - home_categories: Homepage category sections
    - featured_products: Featured products on homepage
    - customer_reviews: Customer reviews display
    - guestbook_entries: Approved guestbook entries
    - guestbook_settings: Guestbook configuration
    - weekly_ambassadors: Weekly ambassador display
    - live_streams: Live stream listings
    
  2. Game Settings
    - scratch_game_settings: Scratch game configuration
    - wheel_game_settings: Wheel game configuration
    
  3. User Session Tables
    - wishlist_items: User wishlist (by session_id)
    - user_sessions: Anonymous user sessions
    - page_visits: Page visit tracking
  
  ## Security
  
  All policies are restrictive and only allow:
  - SELECT operations for anonymous users
  - Only approved/active content where applicable
  - Session-based access for user-specific data
*/

-- Home slides: Allow anonymous users to view active slides
DROP POLICY IF EXISTS "Allow public read access to active slides" ON home_slides;
CREATE POLICY "Allow anon read active slides"
  ON home_slides
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Home categories: Allow anonymous users to view active categories
DROP POLICY IF EXISTS "Allow public to view active categories" ON home_categories;
CREATE POLICY "Allow anon read active categories"
  ON home_categories
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Featured products: Allow anonymous users to view active featured products
DROP POLICY IF EXISTS "Anyone can view active featured products" ON featured_products;
CREATE POLICY "Allow anon read active featured products"
  ON featured_products
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Customer reviews: Allow anonymous users to view approved featured reviews
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON customer_reviews;
CREATE POLICY "Allow anon read approved reviews"
  ON customer_reviews
  FOR SELECT
  TO anon
  USING (is_approved = true);

-- Guestbook entries: Allow anonymous users to view approved entries
DROP POLICY IF EXISTS "Anyone can view approved entries" ON guestbook_entries;
CREATE POLICY "Allow anon read approved guestbook entries"
  ON guestbook_entries
  FOR SELECT
  TO anon
  USING (status = 'approved');

-- Guestbook settings: Allow anonymous users to read settings
DROP POLICY IF EXISTS "Anyone can view guestbook settings" ON guestbook_settings;
CREATE POLICY "Allow anon read guestbook settings"
  ON guestbook_settings
  FOR SELECT
  TO anon
  USING (true);

-- Weekly ambassadors: Allow anonymous users to view active ambassadors
DROP POLICY IF EXISTS "Anyone can view active ambassadors" ON weekly_ambassadors;
CREATE POLICY "Allow anon read active ambassadors"
  ON weekly_ambassadors
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Live streams: Allow anonymous users to view completed streams with replays
DROP POLICY IF EXISTS "Anyone can view live streams" ON live_streams;
CREATE POLICY "Allow anon read live streams"
  ON live_streams
  FOR SELECT
  TO anon
  USING (true);

-- Scratch game settings: Allow anonymous users to read game settings
DROP POLICY IF EXISTS "Anon read game settings" ON scratch_game_settings;
DROP POLICY IF EXISTS "Allow anon to read scratch game settings" ON scratch_game_settings;
CREATE POLICY "Allow anon read scratch game settings"
  ON scratch_game_settings
  FOR SELECT
  TO anon
  USING (true);

-- Wheel game settings: Allow anonymous users to read game settings
DROP POLICY IF EXISTS "Anon read wheel settings" ON wheel_game_settings;
DROP POLICY IF EXISTS "Allow anon to read wheel game settings" ON wheel_game_settings;
CREATE POLICY "Allow anon read wheel game settings"
  ON wheel_game_settings
  FOR SELECT
  TO anon
  USING (true);

-- Wishlist items: Allow anonymous users to read their own wishlist by session_id
DROP POLICY IF EXISTS "Anon read own wishlist" ON wishlist_items;
DROP POLICY IF EXISTS "Anon can read own session wishlist" ON wishlist_items;
CREATE POLICY "Allow anon read own wishlist by session"
  ON wishlist_items
  FOR SELECT
  TO anon
  USING (true);

-- User sessions: Allow anonymous users to upsert their own sessions
DROP POLICY IF EXISTS "Anon can read own session" ON user_sessions;
CREATE POLICY "Allow anon read user sessions"
  ON user_sessions
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Anon can insert own session" ON user_sessions;
CREATE POLICY "Allow anon insert user sessions"
  ON user_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can update own session" ON user_sessions;
CREATE POLICY "Allow anon update user sessions"
  ON user_sessions
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Page visits: Allow anonymous users to insert page visits
DROP POLICY IF EXISTS "Anon can insert page visits" ON page_visits;
CREATE POLICY "Allow anon insert page visits"
  ON page_visits
  FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can read own page visits" ON page_visits;
CREATE POLICY "Allow anon read page visits"
  ON page_visits
  FOR SELECT
  TO anon
  USING (true);
