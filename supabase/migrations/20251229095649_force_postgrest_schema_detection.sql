/*
  # Force PostgREST Schema Detection

  1. Changes
    - Add temporary column to profiles to force schema change detection
    - Remove temporary column immediately after
    - This should force PostgREST to reload its entire schema cache
  
  2. Notes
    - This is a last resort to force PostgREST cache invalidation
*/

-- Add a temporary column to force schema change
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS temp_cache_bust timestamp DEFAULT now();

-- Remove it immediately
ALTER TABLE profiles DROP COLUMN IF EXISTS temp_cache_bust;

-- Force a transaction that PostgREST must detect
DO $$
BEGIN
  -- This forces a schema version bump
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
END $$;

-- Update all table comments to force detection
COMMENT ON TABLE profiles IS 'User profiles - schema forced reload 2025-12-29 14:00';
COMMENT ON TABLE user_roles IS 'User roles - schema forced reload 2025-12-29 14:00';
COMMENT ON TABLE cart_items IS 'Cart items - schema forced reload 2025-12-29 14:00';
COMMENT ON TABLE wishlist_items IS 'Wishlist items - schema forced reload 2025-12-29 14:00';
COMMENT ON TABLE delivery_batches IS 'Delivery batches - schema forced reload 2025-12-29 14:00';
COMMENT ON TABLE loyalty_points IS 'Loyalty points - schema forced reload 2025-12-29 14:00';
COMMENT ON TABLE page_visits IS 'Page visits - schema forced reload 2025-12-29 14:00';

-- Grant explicit permissions to anon role (in case they were lost)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;
