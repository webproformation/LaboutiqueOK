-- ============================================================================
-- DONNER LES DROITS ADMIN À webpro@o2switch.fr
-- ============================================================================

-- Ce script donne les droits admin à l'utilisateur webpro@o2switch.fr

DO $$
DECLARE
  target_user_id uuid;
  target_email text := 'webpro@o2switch.fr';
BEGIN
  -- Récupérer l'ID de l'utilisateur
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  -- Vérifier que l'utilisateur existe
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur % non trouvé dans auth.users', target_email;
  END IF;

  -- Insérer le rôle admin
  INSERT INTO user_roles (user_id, role, created_at, updated_at)
  VALUES (target_user_id, 'admin', now(), now())
  ON CONFLICT (user_id, role) DO UPDATE
  SET updated_at = now();

  -- Mettre à jour admin_access dans user_profiles
  UPDATE user_profiles
  SET admin_access = true,
      updated_at = now()
  WHERE id = target_user_id;

  -- Message de succès
  RAISE NOTICE '✅ Droits admin accordés à % (ID: %)', target_email, target_user_id;
END $$;

-- Vérification
SELECT
  u.email,
  u.id,
  ur.role,
  up.admin_access,
  'Droits admin accordés avec succès' as status
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN user_profiles up ON up.id = u.id
WHERE u.email = 'webpro@o2switch.fr';
