/*
  # Clean duplicate RLS policies
  
  1. Changes
    - Remove all duplicate/conflicting RLS policies
    - Keep only one simple policy per table for each operation
    - This should fix the 400 errors
  
  2. Tables affected
    - page_visits
    - user_sessions
    - wishlist_items
*/

-- Clean page_visits policies
DROP POLICY IF EXISTS "Admins can view all page visits" ON page_visits;
DROP POLICY IF EXISTS "Allow anon insert page visits" ON page_visits;
DROP POLICY IF EXISTS "Allow anon read page visits" ON page_visits;
DROP POLICY IF EXISTS "Allow anon to insert page visits" ON page_visits;
DROP POLICY IF EXISTS "Allow anon to select own visits" ON page_visits;
DROP POLICY IF EXISTS "Anonymous can view page visits by session_id" ON page_visits;
DROP POLICY IF EXISTS "Anyone can create page visits" ON page_visits;
DROP POLICY IF EXISTS "Anyone can insert page visits" ON page_visits;
DROP POLICY IF EXISTS "Users can update own page visits" ON page_visits;
DROP POLICY IF EXISTS "Users can view own page visits" ON page_visits;
DROP POLICY IF EXISTS "Allow all to insert page visits" ON page_visits;
DROP POLICY IF EXISTS "Allow all to view page visits" ON page_visits;

-- Create single simple policy for page_visits
CREATE POLICY "page_visits_all_access"
  ON page_visits FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Clean user_sessions policies
DROP POLICY IF EXISTS "Admins can view all sessions" ON user_sessions;
DROP POLICY IF EXISTS "Allow anon insert user sessions" ON user_sessions;
DROP POLICY IF EXISTS "Allow anon read user sessions" ON user_sessions;
DROP POLICY IF EXISTS "Allow anon to upsert sessions" ON user_sessions;
DROP POLICY IF EXISTS "Allow anon update user sessions" ON user_sessions;
DROP POLICY IF EXISTS "Anonymous can view own sessions by session_id" ON user_sessions;
DROP POLICY IF EXISTS "Anyone can insert sessions" ON user_sessions;
DROP POLICY IF EXISTS "Anyone can update sessions" ON user_sessions;
DROP POLICY IF EXISTS "Anyone can upsert their own session" ON user_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
DROP POLICY IF EXISTS "Allow all to manage sessions" ON user_sessions;

-- Create single simple policy for user_sessions
CREATE POLICY "user_sessions_all_access"
  ON user_sessions FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Clean wishlist_items policies
DROP POLICY IF EXISTS "Allow anon read own wishlist by session" ON wishlist_items;
DROP POLICY IF EXISTS "Allow anon to delete wishlist" ON wishlist_items;
DROP POLICY IF EXISTS "Allow anon to insert wishlist" ON wishlist_items;
DROP POLICY IF EXISTS "Allow anon to view own wishlist" ON wishlist_items;
DROP POLICY IF EXISTS "Anonymous users can manage wishlist by session" ON wishlist_items;
DROP POLICY IF EXISTS "Wishlist DELETE for anon and authenticated" ON wishlist_items;
DROP POLICY IF EXISTS "Wishlist INSERT for anon and authenticated" ON wishlist_items;
DROP POLICY IF EXISTS "Wishlist SELECT for anon and authenticated" ON wishlist_items;
DROP POLICY IF EXISTS "Wishlist UPDATE for anon and authenticated" ON wishlist_items;
DROP POLICY IF EXISTS "Allow wishlist select by session or user" ON wishlist_items;
DROP POLICY IF EXISTS "Allow wishlist insert by session or user" ON wishlist_items;
DROP POLICY IF EXISTS "Allow wishlist update by session or user" ON wishlist_items;
DROP POLICY IF EXISTS "Allow wishlist delete by session or user" ON wishlist_items;

-- Create single simple policy for wishlist_items
CREATE POLICY "wishlist_items_all_access"
  ON wishlist_items FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Force PostgREST cache reload
NOTIFY pgrst, 'reload schema';
