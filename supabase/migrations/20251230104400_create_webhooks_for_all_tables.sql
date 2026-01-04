/*
  # Créer des webhooks pour toutes les tables principales
  
  1. Changes
    - Créer des triggers pour appeler le webhook sur toutes les tables
    - Un trigger par table principale
  
  2. Goal
    - Forcer le rechargement du cache PostgREST à chaque modification
*/

-- Fonction générique pour les webhooks
CREATE OR REPLACE FUNCTION notify_table_change()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url text := 'https://qcqbtmvbvipsxwjlgjvk.supabase.co/functions/v1/webhook-revalidator';
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
    'old_record', CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END
  );
  
  -- Fire and forget HTTP call
  PERFORM
    net.http_post(
      url := webhook_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json'
      ),
      body := payload
    );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Liste des tables principales à surveiller
DO $$
DECLARE
  table_names text[] := ARRAY[
    'profiles', 'loyalty_points', 'delivery_batches', 'user_sessions',
    'page_visits', 'orders', 'order_items', 'addresses', 'cart_items',
    'home_slides', 'home_categories', 'featured_products', 'live_streams',
    'loyalty_tiers', 'loyalty_rewards', 'user_roles', 'customer_reviews',
    'guestbook_entries', 'news_posts', 'news_categories', 'gift_thresholds',
    'weekly_ambassadors', 'looks', 'look_products', 'shipping_methods',
    'scratch_game_settings', 'wheel_game_settings', 'contact_messages'
  ];
  table_name text;
  trigger_name text;
BEGIN
  FOREACH table_name IN ARRAY table_names
  LOOP
    -- Vérifier si la table existe
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = table_name) THEN
      trigger_name := 'webhook_reload_' || table_name;
      
      -- Drop existing trigger if exists
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', trigger_name, table_name);
      
      -- Create new trigger
      EXECUTE format(
        'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION notify_table_change()',
        trigger_name,
        table_name
      );
      
      RAISE NOTICE 'Created webhook trigger for table: %', table_name;
    END IF;
  END LOOP;
END $$;

-- Force reload
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
END $$;
