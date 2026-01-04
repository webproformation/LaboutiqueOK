/*
  # Force PostgREST Schema Cache Reload

  This migration forces PostgREST to immediately reload its schema cache
  by sending a NOTIFY signal on the pgrst channel.
*/

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
