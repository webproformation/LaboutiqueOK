/*
  # Force schema cache refresh for wishlist_items
  
  1. Changes
    - Add a comment to the wishlist_items table to force PostgREST to reload the schema cache
    - This resolves PGRST205 error when the table exists but is not in the cache
*/

-- Add comment to force schema cache refresh
COMMENT ON TABLE wishlist_items IS 'User wishlist items with session-based access';

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
