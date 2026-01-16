/*
  # Système d'envoi automatique d'emails

  1. Nouvelles fonctions
    - `send_order_status_email_trigger` : Envoi email quand statut commande change
    - `send_welcome_email_trigger` : Envoi email de bienvenue à l'inscription

  2. Triggers
    - orders : Déclenchement sur update du statut (expédition, click & collect)
    - profiles : Déclenchement sur insertion (nouvel utilisateur)

  3. Sécurité
    - Fonctions SECURITY DEFINER pour accès contrôlé
    - Vérification des emails avant envoi

  Note: Cette migration nécessite l'extension pg_net pour les appels HTTP.
  Activez-la dans Supabase Dashboard > Database > Extensions > pg_net
*/

-- Fonction pour envoyer un email de bienvenue
CREATE OR REPLACE FUNCTION send_welcome_email_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  api_url TEXT;
  response_status INT;
BEGIN
  -- Vérifier que l'email existe
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN
    -- URL de base de l'application
    api_url := current_setting('app.settings.api_url', true);
    IF api_url IS NULL OR api_url = '' THEN
      api_url := 'https://laboutiquedemorgane.com';
    END IF;

    -- Appel à l'API d'envoi d'emails (asynchrone, ne bloque pas l'insertion)
    BEGIN
      SELECT status INTO response_status
      FROM net.http_post(
        url := api_url || '/api/emails/welcome',
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'to', NEW.email,
          'data', jsonb_build_object(
            'firstName', COALESCE(NEW.first_name, 'Voisine')
          )
        )::text
      );

      -- Log du succès
      RAISE NOTICE 'Email de bienvenue envoyé à % (status: %)', NEW.email, response_status;
    EXCEPTION
      WHEN OTHERS THEN
        -- Ne pas bloquer l'insertion en cas d'erreur d'envoi
        RAISE WARNING 'Erreur lors de l''envoi de l''email de bienvenue à %: %', NEW.email, SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Fonction pour envoyer un email lors du changement de statut de commande
CREATE OR REPLACE FUNCTION send_order_status_email_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email TEXT;
  user_first_name TEXT;
  api_url TEXT;
  response_status INT;
BEGIN
  -- Récupérer l'email et le prénom de l'utilisateur
  SELECT p.email, p.first_name
  INTO user_email, user_first_name
  FROM profiles p
  WHERE p.id = NEW.user_id;

  -- URL de base de l'application
  api_url := current_setting('app.settings.api_url', true);
  IF api_url IS NULL OR api_url = '' THEN
    api_url := 'https://laboutiquedemorgane.com';
  END IF;

  -- Si le statut passe à "shipped" (expédié)
  IF NEW.status = 'shipped' AND (OLD.status IS NULL OR OLD.status != 'shipped') THEN
    IF user_email IS NOT NULL THEN
      BEGIN
        SELECT status INTO response_status
        FROM net.http_post(
          url := api_url || '/api/emails/shipping',
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'to', user_email,
            'data', jsonb_build_object(
              'firstName', COALESCE(user_first_name, 'Voisine'),
              'trackingNumber', COALESCE(NEW.tracking_number, 'Non disponible'),
              'trackingUrl', NEW.tracking_url
            )
          )::text
        );

        RAISE NOTICE 'Email d''expédition envoyé à % (commande %)', user_email, NEW.order_number;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Erreur lors de l''envoi de l''email d''expédition: %', SQLERRM;
      END;
    END IF;
  END IF;

  -- Si le statut passe à "ready_for_pickup" (Click & Collect)
  IF NEW.status = 'ready_for_pickup' AND (OLD.status IS NULL OR OLD.status != 'ready_for_pickup') THEN
    IF user_email IS NOT NULL THEN
      BEGIN
        SELECT status INTO response_status
        FROM net.http_post(
          url := api_url || '/api/emails/click-and-collect',
          headers := '{"Content-Type": "application/json"}'::jsonb,
          body := jsonb_build_object(
            'to', user_email,
            'data', jsonb_build_object(
              'firstName', COALESCE(user_first_name, 'Voisine')
            )
          )::text
        );

        RAISE NOTICE 'Email Click & Collect envoyé à % (commande %)', user_email, NEW.order_number;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Erreur lors de l''envoi de l''email Click & Collect: %', SQLERRM;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger : Envoyer email de bienvenue à l'inscription
DROP TRIGGER IF EXISTS on_user_created_send_welcome_email ON profiles;
CREATE TRIGGER on_user_created_send_welcome_email
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION send_welcome_email_trigger();

-- Trigger : Envoyer email lors du changement de statut de commande
DROP TRIGGER IF EXISTS on_order_status_changed_send_email ON orders;
CREATE TRIGGER on_order_status_changed_send_email
  AFTER UPDATE ON orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION send_order_status_email_trigger();

-- Commentaires pour la documentation
COMMENT ON FUNCTION send_welcome_email_trigger() IS 'Envoie automatiquement un email de bienvenue lors de la création d''un profil utilisateur';
COMMENT ON FUNCTION send_order_status_email_trigger() IS 'Envoie automatiquement un email lors du changement de statut d''une commande (expédition, Click & Collect)';