/*
  # Force PostgREST to Detect RPC Functions
  
  1. Actions
    - Drop and recreate get_user_role function
    - Drop and recreate get_loyalty_tier function
    - Use VOLATILE instead of STABLE to bypass cache
    - Grant explicit permissions
    - Force schema change detection
    
  2. Security
    - Functions are SECURITY DEFINER
    - Accessible by all roles
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_user_role(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_loyalty_tier(uuid) CASCADE;

-- Recreate get_user_role with explicit schema
CREATE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
AS $$
DECLARE
  v_role text;
BEGIN
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_role, 'customer');
END;
$$;

-- Recreate get_loyalty_tier with explicit schema
CREATE FUNCTION public.get_loyalty_tier(p_user_id uuid)
RETURNS TABLE (
  tier integer,
  multiplier integer,
  tier_name text,
  current_balance numeric,
  next_tier_threshold numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
VOLATILE
AS $$
DECLARE
  v_balance numeric;
BEGIN
  SELECT COALESCE(wallet_balance, 0.00) INTO v_balance
  FROM public.user_profiles
  WHERE id = p_user_id;

  IF v_balance >= 15 THEN
    RETURN QUERY SELECT
      3::integer,
      3::integer,
      'Palier 3'::text,
      v_balance,
      30.00::numeric;
  ELSIF v_balance >= 5 THEN
    RETURN QUERY SELECT
      2::integer,
      2::integer,
      'Palier 2'::text,
      v_balance,
      15.00::numeric;
  ELSE
    RETURN QUERY SELECT
      1::integer,
      1::integer,
      'Palier 1'::text,
      v_balance,
      5.00::numeric;
  END IF;
END;
$$;

-- Grant explicit permissions
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.get_loyalty_tier(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_loyalty_tier(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_loyalty_tier(uuid) TO service_role;

-- Add comment to force schema change detection
COMMENT ON FUNCTION public.get_user_role(uuid) IS 'Returns the role of a user';
COMMENT ON FUNCTION public.get_loyalty_tier(uuid) IS 'Returns loyalty tier information for a user';

-- Force PostgREST reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
