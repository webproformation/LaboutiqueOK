/*
  # Setup Automated Daily Backup Cron Job

  1. Configuration
    - Creates a cron job that runs daily at 3:00 AM (UTC)
    - Calls the automated-backup edge function
    - Uses pg_cron extension for scheduling
    - Uses pg_net extension for HTTP requests
  
  2. Cron Schedule
    - Schedule: '0 3 * * *' (every day at 3:00 AM UTC)
    - Job name: 'daily-automated-backup'
  
  3. Notes
    - Backups older than 7 days are automatically cleaned up by the edge function
    - The edge function handles all backup logic and error handling
    - Requires pg_cron and pg_net extensions to be enabled (default in Supabase)
*/

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop existing job if it exists
SELECT cron.unschedule('daily-automated-backup')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-automated-backup'
);

-- Create the cron job to run daily at 3:00 AM UTC
-- The job calls the automated-backup edge function
SELECT cron.schedule(
  'daily-automated-backup',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/automated-backup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Store Supabase URL and anon key in database settings for the cron job
-- These will be set via ALTER DATABASE but we create a helper function
DO $$
BEGIN
  -- Try to set the settings (will work if permissions allow)
  -- If not, these need to be set manually or via Supabase dashboard
  BEGIN
    EXECUTE format('ALTER DATABASE %I SET app.settings.supabase_url = %L', 
      current_database(), 
      current_setting('request.headers', true)::json->>'x-forwarded-host'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Settings will need to be configured via Supabase dashboard or SQL editor
    RAISE NOTICE 'Could not set app.settings.supabase_url automatically';
  END;
END $$;

-- Create a table to track cron job executions (optional, for monitoring)
CREATE TABLE IF NOT EXISTS backup_cron_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_time timestamptz DEFAULT now(),
  status text,
  details jsonb
);

-- Enable RLS on backup_cron_log
ALTER TABLE backup_cron_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view cron logs
CREATE POLICY "Admins can view cron logs"
  ON backup_cron_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );