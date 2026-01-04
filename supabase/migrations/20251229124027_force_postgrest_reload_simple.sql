/*
  # Force PostgREST Cache Reload
  
  Force PostgREST à recharger son cache
*/

-- Envoyer signal de rechargement à PostgREST
NOTIFY pgrst, 'reload schema';

-- Ajouter commentaire pour forcer détection
COMMENT ON SCHEMA public IS 'Schema reloaded 2024-12-29';

-- Vérifier que les fonctions RPC existent
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'upsert_user_session'
  ) THEN
    RAISE NOTICE 'Function upsert_user_session not found';
  END IF;
END $$;

-- Notifications finales
SELECT pg_notify('pgrst', 'reload config');
SELECT pg_notify('pgrst', 'reload schema');