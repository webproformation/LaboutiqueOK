/*
  # Mise à jour de l'URL Supabase pour les webhooks

  Met à jour la fonction trigger_revalidation_webhook avec la bonne URL Supabase de production.
*/

-- Mettre à jour la fonction avec la bonne URL
CREATE OR REPLACE FUNCTION public.trigger_revalidation_webhook()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  webhook_url TEXT;
  payload JSONB;
  project_url TEXT;
BEGIN
  -- Récupère l'URL du projet Supabase depuis les variables d'environnement
  project_url := current_setting('app.settings.supabase_url', TRUE);
  
  -- Si pas configuré, utilise l'URL de production
  IF project_url IS NULL OR project_url = '' THEN
    project_url := 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
  END IF;
  
  webhook_url := project_url || '/functions/v1/webhook-revalidator';

  -- Prépare le payload selon le type d'opération
  IF TG_OP = 'DELETE' THEN
    payload := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'type', TG_OP,
      'old_record', row_to_json(OLD)
    );
  ELSE
    payload := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'type', TG_OP,
      'record', row_to_json(NEW)
    );
  END IF;

  -- Envoie le webhook de manière asynchrone via pg_net
  PERFORM net.http_post(
    url := webhook_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := payload,
    timeout_milliseconds := 5000
  );

  -- Retourne la ligne appropriée selon l'opération
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;
