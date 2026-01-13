/*
  # Offre de Bienvenue : 5€ offerts

  1. Modification
    - Mise à jour de la fonction handle_new_user
    - Initialise wallet_balance à 5.00 au lieu de 0
    - Tous les nouveaux utilisateurs recevront automatiquement 5€

  2. Notes
    - L'offre s'applique automatiquement lors de l'inscription
    - Le crédit est immédiatement disponible dans le porte-monnaie
    - La notification de bienvenue sera affichée via toast dans l'interface
*/

-- Recréer la fonction avec l'offre de bienvenue
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insérer le profil avec 5€ de bienvenue
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
    loyalty_euros,
    current_tier,
    tier_multiplier,
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
    5.00,
    0.00,
    1,
    1,
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
    RAISE WARNING 'Erreur dans handle_new_user pour user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;