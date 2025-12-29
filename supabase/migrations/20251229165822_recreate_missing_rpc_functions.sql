/*
  # Recreate Missing RPC Functions with Proper Permissions

  1. Functions Created
    - `get_user_role(p_user_id)` - Get user role from user_roles table
    - `get_loyalty_tier(p_user_id)` - Get loyalty tier information
    - `get_loyalty_balance(p_user_id)` - Get user loyalty balance

  2. Security
    - All functions are SECURITY DEFINER
    - Granted to authenticated, anon, and service_role
    - Functions can be called by anyone to view public information

  3. Notes
    - Forces PostgREST cache reload via NOTIFY
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_user_role(uuid);
DROP FUNCTION IF EXISTS get_loyalty_tier(uuid);
DROP FUNCTION IF EXISTS get_loyalty_balance(uuid);

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM user_roles
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_role, 'customer');
END;
$$;

-- Function to get loyalty balance
CREATE OR REPLACE FUNCTION get_loyalty_balance(p_user_id uuid)
RETURNS decimal(10,2)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_balance decimal(10,2);
BEGIN
  SELECT COALESCE(wallet_balance, 0.00) INTO v_balance
  FROM user_profiles
  WHERE id = p_user_id;
  
  RETURN COALESCE(v_balance, 0.00);
END;
$$;

-- Function to get loyalty tier
CREATE OR REPLACE FUNCTION get_loyalty_tier(p_user_id uuid)
RETURNS TABLE (
  tier integer,
  multiplier integer,
  tier_name text,
  current_balance decimal(10,2),
  next_tier_threshold decimal(10,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_balance decimal(10,2);
BEGIN
  v_balance := get_loyalty_balance(p_user_id);

  IF v_balance >= 15 THEN
    RETURN QUERY SELECT
      3 as tier,
      3 as multiplier,
      'Palier 3' as tier_name,
      v_balance as current_balance,
      30.00 as next_tier_threshold;
  ELSIF v_balance >= 5 THEN
    RETURN QUERY SELECT
      2 as tier,
      2 as multiplier,
      'Palier 2' as tier_name,
      v_balance as current_balance,
      15.00 as next_tier_threshold;
  ELSE
    RETURN QUERY SELECT
      1 as tier,
      1 as multiplier,
      'Palier 1' as tier_name,
      v_balance as current_balance,
      5.00 as next_tier_threshold;
  END IF;
END;
$$;

-- Grant execute permissions to all roles
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_loyalty_balance(uuid) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_loyalty_tier(uuid) TO authenticated, anon, service_role;

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';