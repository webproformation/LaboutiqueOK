/*
  # Système de Webhooks Automatiques pour Revalidation Next.js

  ## Vue d'ensemble
  Ce système utilise PostgreSQL et pg_net pour envoyer automatiquement des webhooks
  vers l'Edge Function qui revalidera le cache Next.js.

  ## Fonctionnalités
  1. Active l'extension pg_net pour faire des requêtes HTTP depuis Postgres
  2. Crée une fonction trigger qui appelle l'Edge Function webhook-revalidator
  3. Attache des triggers aux tables importantes pour déclencher la revalidation

  ## Tables surveillées
  - home_slides (slider accueil)
  - featured_products (produits mis en avant)
  - delivery_batches (lots de livraison)
  - live_streams (diffusions en direct)
  - guestbook_entries (livre d'or)
  - customer_reviews (avis clients)
  - weekly_ambassadors (ambassadrice de la semaine)
  - gift_thresholds (seuils cadeaux)

  ## Sécurité
  - Les webhooks sont envoyés de manière asynchrone via pg_net
  - Pas de blocage des opérations utilisateur
  - Fonctionne au niveau base de données (bypass le cache PostgREST)
*/

-- Active l'extension pg_net si ce n'est pas déjà fait
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Fonction qui envoie le webhook à l'Edge Function
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
  -- Note: Remplacez par votre URL Supabase complète
  project_url := current_setting('app.settings.supabase_url', TRUE);
  
  -- Si pas configuré, utilise une URL par défaut (à configurer)
  IF project_url IS NULL OR project_url = '' THEN
    project_url := 'https://oaeczvfpqyxqaqdhuxsl.supabase.co';
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

-- Supprime les triggers existants s'ils existent
DROP TRIGGER IF EXISTS trigger_revalidate_home_slides ON public.home_slides;
DROP TRIGGER IF EXISTS trigger_revalidate_featured_products ON public.featured_products;
DROP TRIGGER IF EXISTS trigger_revalidate_delivery_batches ON public.delivery_batches;
DROP TRIGGER IF EXISTS trigger_revalidate_live_streams ON public.live_streams;
DROP TRIGGER IF EXISTS trigger_revalidate_guestbook_entries ON public.guestbook_entries;
DROP TRIGGER IF EXISTS trigger_revalidate_customer_reviews ON public.customer_reviews;
DROP TRIGGER IF EXISTS trigger_revalidate_weekly_ambassadors ON public.weekly_ambassadors;
DROP TRIGGER IF EXISTS trigger_revalidate_gift_thresholds ON public.gift_thresholds;

-- Crée les triggers pour chaque table importante

-- 1. Home Slides (slider accueil)
CREATE TRIGGER trigger_revalidate_home_slides
  AFTER INSERT OR UPDATE OR DELETE
  ON public.home_slides
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_revalidation_webhook();

-- 2. Featured Products (produits mis en avant)
CREATE TRIGGER trigger_revalidate_featured_products
  AFTER INSERT OR UPDATE OR DELETE
  ON public.featured_products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_revalidation_webhook();

-- 3. Delivery Batches (lots de livraison)
CREATE TRIGGER trigger_revalidate_delivery_batches
  AFTER INSERT OR UPDATE OR DELETE
  ON public.delivery_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_revalidation_webhook();

-- 4. Live Streams (diffusions en direct)
CREATE TRIGGER trigger_revalidate_live_streams
  AFTER INSERT OR UPDATE OR DELETE
  ON public.live_streams
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_revalidation_webhook();

-- 5. Guestbook Entries (livre d'or)
CREATE TRIGGER trigger_revalidate_guestbook_entries
  AFTER INSERT OR UPDATE OR DELETE
  ON public.guestbook_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_revalidation_webhook();

-- 6. Customer Reviews (avis clients)
CREATE TRIGGER trigger_revalidate_customer_reviews
  AFTER INSERT OR UPDATE OR DELETE
  ON public.customer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_revalidation_webhook();

-- 7. Weekly Ambassadors (ambassadrice de la semaine)
CREATE TRIGGER trigger_revalidate_weekly_ambassadors
  AFTER INSERT OR UPDATE OR DELETE
  ON public.weekly_ambassadors
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_revalidation_webhook();

-- 8. Gift Thresholds (seuils cadeaux)
CREATE TRIGGER trigger_revalidate_gift_thresholds
  AFTER INSERT OR UPDATE OR DELETE
  ON public.gift_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_revalidation_webhook();

-- Commentaire explicatif
COMMENT ON FUNCTION public.trigger_revalidation_webhook IS 
  'Fonction trigger qui envoie automatiquement un webhook à l''Edge Function webhook-revalidator pour déclencher la revalidation du cache Next.js';
