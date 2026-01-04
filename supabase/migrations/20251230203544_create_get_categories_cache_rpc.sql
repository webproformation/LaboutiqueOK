/*
  # Create RPC function to get categories cache

  1. Problem
    - PostgREST cache doesn't recognize woocommerce_categories_cache table
    - Direct SELECT via Supabase client returns 404

  2. Solution
    - Create RPC function that directly queries the table
    - Bypass PostgREST REST API entirely
    - Use SECURITY DEFINER to run with postgres privileges
*/

-- Create function to get all categories from cache
CREATE OR REPLACE FUNCTION get_woocommerce_categories_cache()
RETURNS TABLE (
  id INTEGER,
  category_id INTEGER,
  name TEXT,
  slug TEXT,
  parent INTEGER,
  description TEXT,
  image JSONB,
  count INTEGER,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wc.id,
    wc.category_id,
    wc.name,
    wc.slug,
    wc.parent,
    wc.description,
    wc.image,
    wc.count,
    wc.updated_at
  FROM woocommerce_categories_cache wc
  ORDER BY wc.category_id ASC;
END;
$$;

-- Grant execute permission to all roles
GRANT EXECUTE ON FUNCTION get_woocommerce_categories_cache() TO anon, authenticated, service_role, public;

-- Add comment
COMMENT ON FUNCTION get_woocommerce_categories_cache IS 'Get all WooCommerce categories from cache - bypasses PostgREST REST API';

-- Force PostgREST reload
NOTIFY pgrst, 'reload schema';
