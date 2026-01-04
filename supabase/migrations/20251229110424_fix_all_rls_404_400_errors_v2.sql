/*
  # Fix RLS 404/400 Errors - Complete RLS Reset
  
  1. Problem Analysis
    - 404 errors: PostgREST cannot find tables due to RLS blocking all access
    - 400 errors: RLS policies with failing conditions or conflicts
    
  2. Tables Affected
    - profiles (404)
    - cart_items (400)
    - delivery_batches (400)
    - loyalty_points (400)
    - page_visits (400)
    - wishlist_items (400)
    
  3. Solution
    - Drop all problematic policies
    - Create simple, non-conflicting policies
    - Ensure anon and authenticated roles have proper access
    - Avoid complex function calls in USING clauses that can fail
*/

-- =====================================================
-- PROFILES TABLE - Fix 404 error
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Anon can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Anon can update profiles" ON profiles;
DROP POLICY IF EXISTS "Anon can view profiles by id" ON profiles;
DROP POLICY IF EXISTS "Public can read basic profile info" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read their own basic profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create simple, working policies
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  TO public
  USING (true);

CREATE POLICY "profiles_insert_auth"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_service"
  ON profiles FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- CART_ITEMS TABLE - Fix 400 error
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Anon can delete cart items" ON cart_items;
DROP POLICY IF EXISTS "Anonymous users can delete items without user_id" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;
DROP POLICY IF EXISTS "Anon can insert cart items" ON cart_items;
DROP POLICY IF EXISTS "Anonymous users can insert items without user_id" ON cart_items;
DROP POLICY IF EXISTS "Users can add items to own cart" ON cart_items;
DROP POLICY IF EXISTS "Anon can view cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can view own cart items" ON cart_items;
DROP POLICY IF EXISTS "Anon can update cart items" ON cart_items;
DROP POLICY IF EXISTS "Anonymous users can update items without user_id" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;

-- Create simple, working policies
CREATE POLICY "cart_items_all_anon"
  ON cart_items FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "cart_items_select_auth"
  ON cart_items FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "cart_items_insert_auth"
  ON cart_items FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "cart_items_update_auth"
  ON cart_items FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "cart_items_delete_auth"
  ON cart_items FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- =====================================================
-- DELIVERY_BATCHES TABLE - Fix 400 error
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can manage all delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Users can delete own delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Anon can insert delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Users can insert own delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Users can view delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Anon can update delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Users can update own delivery batches" ON delivery_batches;

-- Create simple, working policies
CREATE POLICY "delivery_batches_select_all"
  ON delivery_batches FOR SELECT
  TO public
  USING (true);

CREATE POLICY "delivery_batches_insert_auth"
  ON delivery_batches FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "delivery_batches_update_own"
  ON delivery_batches FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "delivery_batches_delete_own"
  ON delivery_batches FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- =====================================================
-- LOYALTY_POINTS TABLE - Fix 400 error
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Anon can insert loyalty points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can insert own loyalty points" ON loyalty_points;
DROP POLICY IF EXISTS "Anon can view loyalty points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can view own loyalty points" ON loyalty_points;
DROP POLICY IF EXISTS "Users can update own loyalty points" ON loyalty_points;

-- Create simple, working policies
CREATE POLICY "loyalty_points_select_all"
  ON loyalty_points FOR SELECT
  TO public
  USING (true);

CREATE POLICY "loyalty_points_insert_service"
  ON loyalty_points FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "loyalty_points_update_service"
  ON loyalty_points FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PAGE_VISITS TABLE - Fix 400 error
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "page_visits_all_access" ON page_visits;
DROP POLICY IF EXISTS "Anon can insert page visits" ON page_visits;
DROP POLICY IF EXISTS "Anon can view page visits" ON page_visits;
DROP POLICY IF EXISTS "Anon can update page visits" ON page_visits;

-- Create simple, working policies
CREATE POLICY "page_visits_all_public"
  ON page_visits FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- WISHLIST_ITEMS TABLE - Fix 400 error
-- Note: wishlist_items has session_id, not user_id
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "wishlist_items_all_access" ON wishlist_items;
DROP POLICY IF EXISTS "Anon can delete wishlist items" ON wishlist_items;
DROP POLICY IF EXISTS "Anon can insert wishlist items" ON wishlist_items;
DROP POLICY IF EXISTS "Anonymous users can view own wishlist items" ON wishlist_items;
DROP POLICY IF EXISTS "Anon can update wishlist items" ON wishlist_items;

-- Create simple, working policies (session-based only)
CREATE POLICY "wishlist_items_all_public"
  ON wishlist_items FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
