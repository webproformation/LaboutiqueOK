/*
  # Force PostgREST à détecter les tables et fonctions via webhooks
  
  1. Stratégie
    - Modifier légèrement les tables/fonctions pour forcer un changement DDL
    - Créer un trigger qui appelle automatiquement le webhook
    - Déclencher le webhook immédiatement
  
  2. Tables ciblées
    - profiles
    
  3. Fonctions ciblées
    - get_user_role
    - get_loyalty_tier
    - analytics_upsert_session
*/

-- 1. Modifier la table profiles pour forcer la détection
COMMENT ON TABLE profiles IS 'User profiles - force detection 2025-12-30 12:00:00';

-- 2. Créer une fonction qui appelle le webhook HTTP
CREATE OR REPLACE FUNCTION trigger_postgrest_reload()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Envoyer une requête HTTP au webhook de revalidation
  PERFORM net.http_post(
    url := 'https://qcqbtmvbvipsxwjlgjvk.supabase.co/functions/v1/webhook-revalidator',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c'
    ),
    body := jsonb_build_object(
      'type', 'UPDATE',
      'table', 'profiles',
      'schema', 'public'
    )
  );
  
  RAISE NOTICE 'Webhook triggered for PostgREST reload';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Failed to trigger webhook: %', SQLERRM;
END;
$$;

-- 3. Appeler la fonction pour déclencher le webhook
SELECT trigger_postgrest_reload();

-- 4. Modifier les fonctions RPC pour forcer leur détection
COMMENT ON FUNCTION get_user_role(uuid) IS 'Get user role - force detection 2025-12-30 12:00:00';
COMMENT ON FUNCTION get_loyalty_tier(uuid) IS 'Get loyalty tier - force detection 2025-12-30 12:00:00';
COMMENT ON FUNCTION analytics_upsert_session(uuid) IS 'Analytics upsert session - force detection 2025-12-30 12:00:00';

-- 5. Faire des modifications GRANT pour forcer la détection
-- Retirer et remettre les droits
REVOKE EXECUTE ON FUNCTION get_user_role(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(uuid) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION get_loyalty_tier(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION get_loyalty_tier(uuid) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION analytics_upsert_session(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION analytics_upsert_session(uuid) TO anon, authenticated;

-- 6. Envoyer des notifications PostgREST
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload schema');

-- 7. Faire un ALTER TABLE factice sur profiles
ALTER TABLE profiles ALTER COLUMN id SET NOT NULL; -- C'est déjà NOT NULL, mais force un DDL

-- 8. Encore des notifications
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload schema');
