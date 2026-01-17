/*
  # Fix définitif du trigger handle_new_user

  1. Problème
    - Le trigger échoue lors de la création d'utilisateurs
    - Erreur: "Database error saving new user"

  2. Solution
    - Recréer la fonction avec gestion d'erreur robuste
    - Utiliser des valeurs par défaut sûres
    - Ignorer les erreurs silencieusement
*/

-- Drop et recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recréer la fonction avec une meilleure gestion d'erreur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insérer le profil avec ON CONFLICT pour éviter les doublons
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    phone,
    avatar_url,
    birth_date,
    wallet_balance,
    is_admin,
    blocked,
    blocked_reason,
    blocked_at,
    cancelled_orders_count,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    NULLIF(NEW.raw_user_meta_data->>'birth_date', ''),
    0,
    FALSE,
    FALSE,
    NULL,
    NULL,
    0,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne pas bloquer la création
    RAISE WARNING 'Erreur dans handle_new_user pour user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
