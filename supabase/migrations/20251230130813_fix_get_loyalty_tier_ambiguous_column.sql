/*
  # Fix get_loyalty_tier ambiguous column reference

  1. Changes
    - Qualify column reference `loyalty_points.lifetime_points` to avoid ambiguity with local variable
    - Ensures proper column/variable resolution in PostgreSQL
  
  2. Security
    - Maintains existing SECURITY DEFINER and permissions
    - No changes to access control
*/

CREATE OR REPLACE FUNCTION public.get_loyalty_tier(p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  lifetime_points numeric := 0;
  tier text := 'bronze';
BEGIN
  -- Explicitly qualify column to avoid ambiguity with variable name
  SELECT COALESCE(loyalty_points.lifetime_points, 0) INTO lifetime_points
  FROM loyalty_points
  WHERE user_id = p_user_id
  LIMIT 1;

  IF lifetime_points >= 1000 THEN
    tier := 'gold';
  ELSIF lifetime_points >= 500 THEN
    tier := 'silver';
  ELSE
    tier := 'bronze';
  END IF;

  RETURN tier;
END;
$function$;

-- Ensure permissions are maintained
GRANT EXECUTE ON FUNCTION public.get_loyalty_tier(uuid) TO anon, authenticated, service_role;
