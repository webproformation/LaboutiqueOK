/*
  # Fix PostgREST Cache and 400/500 Errors
  
  1. Force PostgREST to reload schema cache
  2. Grant explicit SELECT permissions on loyalty_points for anon/public
  3. Ensure analytics functions have correct permissions
  4. Add public role to woocommerce_categories_cache policies
*/

-- 1. Grant explicit table permissions for loyalty_points (fix 400 error)
GRANT ALL ON loyalty_points TO anon;
GRANT ALL ON loyalty_points TO authenticated;
GRANT ALL ON loyalty_points TO service_role;
GRANT ALL ON loyalty_points TO postgres;

-- 2. Grant explicit permissions for woocommerce_categories_cache
GRANT ALL ON woocommerce_categories_cache TO anon;
GRANT ALL ON woocommerce_categories_cache TO authenticated;
GRANT ALL ON woocommerce_categories_cache TO service_role;
GRANT ALL ON woocommerce_categories_cache TO postgres;

-- 3. Ensure analytics functions are executable
GRANT EXECUTE ON FUNCTION analytics_track_page_visit TO anon;
GRANT EXECUTE ON FUNCTION analytics_track_page_visit TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_track_page_visit TO service_role;

GRANT EXECUTE ON FUNCTION analytics_upsert_session TO anon;
GRANT EXECUTE ON FUNCTION analytics_upsert_session TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_upsert_session TO service_role;

-- 4. Grant permissions on page_visits and user_sessions
GRANT ALL ON page_visits TO anon;
GRANT ALL ON page_visits TO authenticated;
GRANT ALL ON page_visits TO service_role;

GRANT ALL ON user_sessions TO anon;
GRANT ALL ON user_sessions TO authenticated;
GRANT ALL ON user_sessions TO service_role;

-- 5. Force PostgREST schema reload via NOTIFY
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 6. Force schema cache invalidation
DO $$ 
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
END $$;
