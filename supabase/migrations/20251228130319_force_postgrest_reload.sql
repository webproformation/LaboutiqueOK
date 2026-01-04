/*
  # Force PostgREST schema cache reload

  This migration forces PostgREST to reload its schema cache
  by performing a trivial schema change.
*/

-- Add a temporary comment to force schema cache invalidation
COMMENT ON TABLE home_slides IS 'Home page slider configuration - Cache reload forced';
COMMENT ON TABLE home_categories IS 'Home page categories - Cache reload forced';
COMMENT ON TABLE wishlist_items IS 'User wishlist items - Cache reload forced';
COMMENT ON TABLE scratch_game_settings IS 'Scratch game configuration - Cache reload forced';
COMMENT ON TABLE wheel_game_settings IS 'Wheel game configuration - Cache reload forced';

-- Force PostgREST reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
