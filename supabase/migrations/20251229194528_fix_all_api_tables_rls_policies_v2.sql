/*
  # Fix RLS Policies for API Tables v2
  
  1. Wishlist Tables
    - Fix wishlist_items policies (no user_id, only session_id)
  
  2. Analytics Tables
    - Fix page_visits policies
    - Fix user_sessions policies
*/

-- =====================================================
-- WISHLIST ITEMS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Allow all operations on wishlist_items" ON wishlist_items;
DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlist_items;
DROP POLICY IF EXISTS "Anon can manage wishlist by session" ON wishlist_items;
DROP POLICY IF EXISTS "Authenticated can manage own wishlist" ON wishlist_items;
DROP POLICY IF EXISTS "Service role can manage all wishlist" ON wishlist_items;

-- Allow anyone to manage wishlist (session-based, no user_id)
CREATE POLICY "Allow all to manage wishlist"
  ON wishlist_items
  FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PAGE VISITS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Allow all to insert page visits" ON page_visits;
DROP POLICY IF EXISTS "Users can view own page visits" ON page_visits;
DROP POLICY IF EXISTS "Anon can insert page visits" ON page_visits;
DROP POLICY IF EXISTS "Anyone can insert page visits" ON page_visits;
DROP POLICY IF EXISTS "Users can view own visits" ON page_visits;
DROP POLICY IF EXISTS "Service role can manage all page visits" ON page_visits;

-- Allow anyone to insert page visits
CREATE POLICY "Allow all to insert page visits"
  ON page_visits
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- Allow anyone to read page visits
CREATE POLICY "Allow all to read page visits"
  ON page_visits
  FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

-- =====================================================
-- USER SESSIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Allow anon read own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Anon can manage sessions" ON user_sessions;
DROP POLICY IF EXISTS "Anyone can manage sessions" ON user_sessions;
DROP POLICY IF EXISTS "Service role can manage all sessions" ON user_sessions;

-- Allow anyone to manage sessions
CREATE POLICY "Allow all to manage sessions"
  ON user_sessions
  FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- FORCE POSTGREST RELOAD
-- =====================================================

DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
END $$;
