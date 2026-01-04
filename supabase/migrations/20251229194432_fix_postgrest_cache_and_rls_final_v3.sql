/*
  # Fix PostgREST Cache and RLS Issues - Final v3
  
  1. RPC Functions Missing (404 errors)
    - Recreate get_loyalty_tier function
    - Recreate award_daily_connection_bonus function
    - Grant proper permissions
  
  2. RLS Issues (400 errors)
    - Fix cart_items policies for user_id queries
    - Fix delivery_batches policies for user_id queries
    - Fix loyalty_points policies for authenticated users
  
  3. Force PostgREST Cache Reload
    - Use NOTIFY pgrst to force schema reload
    - Add dummy schema change for detection
*/

-- =====================================================
-- PART 1: DROP AND RECREATE RPC FUNCTIONS
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_loyalty_tier(uuid) CASCADE;
DROP FUNCTION IF EXISTS award_daily_connection_bonus(uuid) CASCADE;

-- Recreate get_loyalty_tier function
CREATE OR REPLACE FUNCTION get_loyalty_tier(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_points integer;
  v_tier text;
BEGIN
  -- Get total points for user
  SELECT COALESCE(SUM(points), 0)
  INTO v_total_points
  FROM loyalty_points
  WHERE user_id = p_user_id;

  -- Determine tier based on points
  IF v_total_points >= 10000 THEN
    v_tier := 'diamond';
  ELSIF v_total_points >= 5000 THEN
    v_tier := 'platinum';
  ELSIF v_total_points >= 2000 THEN
    v_tier := 'gold';
  ELSIF v_total_points >= 500 THEN
    v_tier := 'silver';
  ELSE
    v_tier := 'bronze';
  END IF;

  RETURN v_tier;
END;
$$;

-- Recreate award_daily_connection_bonus function
CREATE OR REPLACE FUNCTION award_daily_connection_bonus(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_bonus_date date;
  v_current_streak integer := 0;
  v_points integer := 10;
  v_bonus_type text := 'daily_connection';
  v_result json;
BEGIN
  -- Check last bonus date from loyalty_points
  SELECT MAX(DATE(created_at))
  INTO v_last_bonus_date
  FROM loyalty_points
  WHERE user_id = p_user_id
    AND bonus_type = v_bonus_type;

  -- Check if already awarded today
  IF v_last_bonus_date = CURRENT_DATE THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Bonus already awarded today',
      'points', 0
    );
  END IF;

  -- Award bonus points
  INSERT INTO loyalty_points (user_id, points, bonus_type, description)
  VALUES (
    p_user_id,
    v_points,
    v_bonus_type,
    'Bonus de connexion quotidien'
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Bonus awarded successfully',
    'points', v_points
  );
END;
$$;

-- Grant execute permissions to all roles
GRANT EXECUTE ON FUNCTION get_loyalty_tier(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION award_daily_connection_bonus(uuid) TO anon, authenticated, service_role;

-- =====================================================
-- PART 2: FIX RLS POLICIES
-- =====================================================

-- Fix cart_items policies
DROP POLICY IF EXISTS "Allow all operations on cart_items" ON cart_items;
DROP POLICY IF EXISTS "Users can view own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;
DROP POLICY IF EXISTS "Anon can view own cart items" ON cart_items;
DROP POLICY IF EXISTS "Anon can insert cart items" ON cart_items;
DROP POLICY IF EXISTS "Anon can update cart items" ON cart_items;
DROP POLICY IF EXISTS "Anon can delete cart items" ON cart_items;

CREATE POLICY "Allow all authenticated operations on cart_items"
  ON cart_items
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow all anon operations on cart_items"
  ON cart_items
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Fix delivery_batches policies
DROP POLICY IF EXISTS "Users can view own pending batches" ON delivery_batches;
DROP POLICY IF EXISTS "Allow authenticated users to view own delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Allow anon to read delivery_batches" ON delivery_batches;

CREATE POLICY "Allow all to read delivery_batches"
  ON delivery_batches
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated to manage own delivery_batches"
  ON delivery_batches
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix loyalty_points policies
DROP POLICY IF EXISTS "Users can view own loyalty points" ON loyalty_points;
DROP POLICY IF EXISTS "Allow authenticated users to view own loyalty points" ON loyalty_points;
DROP POLICY IF EXISTS "Allow anon to read loyalty_points" ON loyalty_points;

CREATE POLICY "Allow all to read loyalty_points"
  ON loyalty_points
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow authenticated to insert own loyalty_points"
  ON loyalty_points
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can manage all loyalty_points"
  ON loyalty_points
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- PART 3: FORCE POSTGREST RELOAD
-- =====================================================

-- Force schema cache reload via NOTIFY
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
END $$;

-- Add a dummy comment to trigger PostgREST schema detection
COMMENT ON FUNCTION get_loyalty_tier IS 'Returns user loyalty tier - v3';
COMMENT ON FUNCTION award_daily_connection_bonus IS 'Awards daily connection bonus - v3';
