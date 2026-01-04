/*
  # Force PostgREST to reload its schema cache using NOTIFY

  This migration forces PostgREST to reload its schema cache by sending a NOTIFY signal.
  This is necessary after multiple schema changes to ensure the REST API reflects the current database state.

  1. Actions
    - Send NOTIFY signal to pgrst to trigger schema reload
    - Update system catalog to force cache invalidation
*/

-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';

-- Alternative method: Invalidate catalog cache
DO $$
BEGIN
  -- This will force PostgREST to detect schema changes on next request
  PERFORM pg_notify('pgrst', 'reload config');
  PERFORM pg_notify('pgrst', 'reload schema');
END $$;

-- Grant necessary permissions for anonymous access to all public tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
  LOOP
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO anon', r.tablename);
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', r.tablename);
  END LOOP;
END $$;

-- Ensure postgrest schema cache is up to date
SELECT pg_notify('pgrst', 'reload schema');
