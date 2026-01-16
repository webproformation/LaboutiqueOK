/*
  # Fix Trigger handle_new_user - Ajout Colonnes Loyalty

  1. **Problème**
     - Le trigger handle_new_user créé dans 20260107165229 ne contient pas les colonnes loyalty
     - Les colonnes loyalty_euros, current_tier, tier_multiplier ont été ajoutées dans 20260109103613
     - Erreur 500 lors du signup car les colonnes NOT NULL ne sont pas fournies

  2. **Solution**
     - Mettre à jour la fonction handle_new_user pour inclure les 3 colonnes
     - Assurer des valeurs par défaut cohérentes
     - Garantir la compatibilité avec le système de fidélité

  3. **Colonnes ajoutées**
     - loyalty_euros: 0.00 (montant initial en euros)
     - current_tier: 1 (palier de départ)
     - tier_multiplier: 1 (multiplicateur de base)
*/

-- Recréer la fonction avec les colonnes loyalty
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insérer le profil avec TOUTES les colonnes requises
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
    0,
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
    -- Log l'erreur mais ne pas bloquer la création
    RAISE WARNING 'Erreur dans handle_new_user pour user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Le trigger existe déjà, pas besoin de le recréer
-- Il a été créé dans 20260107165229_fix_trigger_handle_new_user_v4.sql
