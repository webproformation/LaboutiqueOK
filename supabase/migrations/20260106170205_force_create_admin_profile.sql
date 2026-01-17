/*
  # Force la création du profil administrateur

  1. Création du profil
    - Crée le profil pour l'utilisateur existant avec is_admin = true
    - Utilise DO block pour contourner les contraintes RLS

  2. Sécurité
    - Profile configuré comme administrateur
*/

DO $$
BEGIN
  -- Désactiver temporairement RLS
  ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
  
  -- Insérer le profil admin
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    phone,
    avatar_url,
    wallet_balance,
    is_admin,
    blocked,
    cancelled_orders_count,
    created_at,
    updated_at
  ) 
  SELECT 
    '8e0c89f2-eb9d-4614-8cc9-bd4693c89f5a'::uuid,
    'contact@webproformation.fr',
    'Admin',
    'Principal',
    '',
    '',
    0,
    true,
    false,
    0,
    NOW(),
    NOW()
  WHERE EXISTS (
    SELECT 1 FROM auth.users WHERE id = '8e0c89f2-eb9d-4614-8cc9-bd4693c89f5a'
  )
  ON CONFLICT (id) DO UPDATE SET
    is_admin = true,
    updated_at = NOW();
  
  -- Réactiver RLS
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
END $$;
