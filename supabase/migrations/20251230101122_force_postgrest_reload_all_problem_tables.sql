/*
  # Force PostgREST reload for all problem tables
  
  1. Changes
    - Force schema change on profiles, loyalty_points, delivery_batches
    - Send multiple NOTIFY signals
  
  2. Goal
    - Force PostgREST to detect and expose all tables
*/

-- Force schema changes on all problem tables
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS _temp_reload text DEFAULT NULL;
ALTER TABLE profiles DROP COLUMN IF EXISTS _temp_reload;

ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS _temp_reload text DEFAULT NULL;
ALTER TABLE loyalty_points DROP COLUMN IF EXISTS _temp_reload;

ALTER TABLE delivery_batches ADD COLUMN IF NOT EXISTS _temp_reload text DEFAULT NULL;
ALTER TABLE delivery_batches DROP COLUMN IF EXISTS _temp_reload;

-- Force multiple notifications
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_sleep(0.1);
  PERFORM pg_notify('pgrst', 'reload config');
  PERFORM pg_sleep(0.1);
  PERFORM pg_notify('pgrst', 'reload schema');
END $$;

-- Update comments
COMMENT ON TABLE profiles IS 'User profiles - forced reload 2025-12-30 10:00';
COMMENT ON TABLE loyalty_points IS 'Loyalty points - forced reload 2025-12-30 10:00';
COMMENT ON TABLE delivery_batches IS 'Delivery batches - forced reload 2025-12-30 10:00';
