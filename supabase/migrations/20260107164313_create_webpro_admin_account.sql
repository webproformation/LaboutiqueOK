/*
  # Création compte admin WebPro

  1. Objectif
    - Créer le compte admin contact@webproformation.fr
    - Définir is_admin = true dans le profil
    - Mot de passe: WebPro2026!

  2. Sécurité
    - Utilise la fonction handle_new_user existante
    - Profil créé automatiquement par le trigger
*/

DO $$
DECLARE
  user_id uuid;
  encrypted_password text;
BEGIN
  -- Supprimer l'utilisateur existant s'il y en a un
  DELETE FROM auth.users WHERE email = 'contact@webproformation.fr';
  
  -- Générer un nouvel UUID
  user_id := gen_random_uuid();
  
  -- Hash du mot de passe WebPro2026! (utilise crypt de pgcrypto)
  encrypted_password := crypt('WebPro2026!', gen_salt('bf'));
  
  -- Créer l'utilisateur dans auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    user_id,
    '00000000-0000-0000-0000-000000000000',
    'contact@webproformation.fr',
    encrypted_password,
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin WebPro","first_name":"Admin","last_name":"WebPro"}',
    'authenticated',
    'authenticated',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
  
  -- Attendre que le trigger crée le profil
  PERFORM pg_sleep(1);
  
  -- Mettre à jour le profil pour is_admin = true
  UPDATE public.profiles
  SET 
    is_admin = true,
    full_name = 'Admin WebPro',
    first_name = 'Admin',
    last_name = 'WebPro'
  WHERE id = user_id;
  
  RAISE NOTICE 'Compte admin créé avec succès: %', user_id;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Erreur: %', SQLERRM;
END $$;
