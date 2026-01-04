/*
  # Create webhook for user_profiles view
  
  1. Changes
    - Create database trigger to call webhook on user_profiles changes
    - Webhook will force PostgREST cache reload
  
  2. Goal
    - Auto-reload PostgREST cache when user_profiles is modified
*/

-- Since user_profiles is a view, we create triggers on the underlying profiles table

-- Drop existing webhook trigger if it exists
DROP TRIGGER IF EXISTS revalidate_user_profiles ON profiles;

-- Create trigger function that calls the webhook
CREATE OR REPLACE FUNCTION notify_user_profiles_change()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url text := 'https://qcqbtmvbvipsxwjlgjvk.supabase.co/functions/v1/webhook-revalidator';
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', 'user_profiles',
    'schema', 'public',
    'record', row_to_json(NEW),
    'old_record', row_to_json(OLD)
  );
  
  -- Call webhook asynchronously (fire and forget)
  PERFORM
    net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := payload
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table for user_profiles view
CREATE TRIGGER revalidate_user_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_profiles_change();

COMMENT ON FUNCTION notify_user_profiles_change() IS 'Webhook trigger for user_profiles view changes';
