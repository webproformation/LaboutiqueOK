-- ============================================================================
-- GRANT ADMIN ACCESS - DIRECT SQL (À EXÉCUTER DANS SUPABASE SQL EDITOR)
-- ============================================================================
-- Ce script donne les droits admin DIRECTEMENT sans passer par PostgREST
-- Remplacez 'VOTRE_EMAIL_ICI' par votre vrai email
-- ============================================================================

-- ÉTAPE 1: Trouvez votre USER ID
-- Exécutez cette requête d'abord pour trouver votre ID
SELECT
  id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'VOTRE_EMAIL_ICI';  -- Remplacez par votre email

-- ÉTAPE 2: Une fois que vous avez votre ID, utilisez-le ci-dessous
-- Remplacez 'VOTRE_USER_ID_ICI' par l'ID obtenu à l'étape 1

DO $$
DECLARE
  target_user_id UUID;
  user_email TEXT := 'VOTRE_EMAIL_ICI';  -- Remplacez par votre email
BEGIN
  -- Récupérer l'ID utilisateur
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non trouvé avec email: %', user_email;
  END IF;

  RAISE NOTICE 'User ID trouvé: %', target_user_id;

  -- Créer ou mettre à jour le profil
  INSERT INTO user_profiles (id, email, wallet_balance, created_at, updated_at)
  VALUES (target_user_id, user_email, 0, now(), now())
  ON CONFLICT (id)
  DO UPDATE SET
    email = user_email,
    updated_at = now();

  RAISE NOTICE 'Profil créé/mis à jour';

  -- Créer le rôle admin
  INSERT INTO user_roles (user_id, role, created_at, updated_at)
  VALUES (target_user_id, 'admin', now(), now())
  ON CONFLICT (user_id, role)
  DO UPDATE SET updated_at = now();

  RAISE NOTICE 'Rôle admin créé/mis à jour';

  -- Afficher confirmation
  RAISE NOTICE '✓ Droits admin accordés avec succès pour: %', user_email;
END $$;

-- ÉTAPE 3: Vérifier que tout est OK
SELECT
  ur.user_id,
  up.email,
  ur.role,
  ur.created_at,
  ur.updated_at
FROM user_roles ur
JOIN user_profiles up ON up.id = ur.user_id
WHERE up.email = 'VOTRE_EMAIL_ICI';  -- Remplacez par votre email

-- ÉTAPE 4: Mettre à jour les métadonnées auth (app_metadata)
-- IMPORTANT: Cette requête utilise le auth schema et nécessite les droits service_role
-- Si elle échoue, ce n'est pas grave, les étapes précédentes suffisent

UPDATE auth.users
SET
  raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
  ),
  raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'::jsonb),
    '{is_admin}',
    'true'
  ),
  updated_at = now()
WHERE email = 'VOTRE_EMAIL_ICI';  -- Remplacez par votre email

-- ÉTAPE 5: Forcer PostgREST à rafraîchir
NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload config');

-- ============================================================================
-- INSTRUCTIONS APRÈS EXÉCUTION
-- ============================================================================
-- 1. Remplacez 'VOTRE_EMAIL_ICI' par votre vrai email dans toutes les requêtes
-- 2. Exécutez ce script dans le SQL Editor de Supabase
-- 3. Allez dans Settings -> API -> Restart PostgREST
-- 4. Déconnectez-vous de votre compte
-- 5. Reconnectez-vous
-- 6. Essayez d'accéder à /admin
-- ============================================================================

-- VÉRIFICATION FINALE
SELECT
  'Admin access granted!' AS status,
  up.email,
  ur.role,
  (SELECT raw_app_meta_data->>'role' FROM auth.users WHERE id = up.id) AS app_metadata_role,
  (SELECT raw_app_meta_data->>'is_admin' FROM auth.users WHERE id = up.id) AS app_metadata_is_admin
FROM user_profiles up
JOIN user_roles ur ON ur.user_id = up.id
WHERE up.email = 'VOTRE_EMAIL_ICI'  -- Remplacez par votre email
  AND ur.role = 'admin';
