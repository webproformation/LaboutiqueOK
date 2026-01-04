/*
  # Force PostgREST Cache Reload - Final Fix

  1. Changes
    - Force complete PostgREST schema cache reload
    - Add comment to trigger cache invalidation
    - Ensure all tables and functions are visible
  
  2. Security
    - No security changes
  
  3. Notes
    - This migration forces PostgREST to reload its schema cache
    - All tables and RPC functions should become accessible after this
*/

-- Force schema cache reload by notifying PostgREST
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Add a comment to force schema change detection
COMMENT ON TABLE profiles IS 'User profiles table - updated 2025-12-29';
COMMENT ON TABLE user_roles IS 'User roles table - updated 2025-12-29';
COMMENT ON TABLE cart_items IS 'Shopping cart items - updated 2025-12-29';
COMMENT ON TABLE delivery_batches IS 'Delivery batches - updated 2025-12-29';
COMMENT ON TABLE loyalty_points IS 'Loyalty points system - updated 2025-12-29';
COMMENT ON TABLE wishlist_items IS 'Wishlist items - updated 2025-12-29';
COMMENT ON TABLE page_visits IS 'Page visit tracking - updated 2025-12-29';

-- Ensure functions are visible
COMMENT ON FUNCTION create_user_profile_manually IS 'Create user profile manually';
COMMENT ON FUNCTION upsert_user_session IS 'Upsert user session tracking';
