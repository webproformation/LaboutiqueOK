/*
  # Force PostgREST reload for user_sessions table
  
  1. Changes
    - Force schema change detection on user_sessions
    - Send multiple NOTIFY signals
  
  2. Goal
    - Make PostgREST detect all columns of user_sessions including last_activity_at
*/

-- Add and remove temp column to force schema change
ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS _temp_reload text DEFAULT NULL;
ALTER TABLE user_sessions DROP COLUMN IF EXISTS _temp_reload;

-- Force multiple notifications with delays
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_sleep(0.2);
  PERFORM pg_notify('pgrst', 'reload config');
  PERFORM pg_sleep(0.2);
  PERFORM pg_notify('pgrst', 'reload schema');
END $$;

-- Update comment
COMMENT ON TABLE user_sessions IS 'User sessions - forced PostgREST reload 2025-12-30 10:20';

-- Same for page_visits
ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS _temp_reload text DEFAULT NULL;
ALTER TABLE page_visits DROP COLUMN IF EXISTS _temp_reload;

COMMENT ON TABLE page_visits IS 'Page visits - forced PostgREST reload 2025-12-30 10:20';
