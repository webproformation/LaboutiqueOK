-- ============================================================================
-- CRÉATION TABLE USER_ROLES + FONCTIONS RPC
-- Ce script crée uniquement ce qui manque sans toucher aux tables existantes
-- ============================================================================

-- ============================================================================
-- 1. CRÉER LA TABLE USER_ROLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'customer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist, then recreate
DROP POLICY IF EXISTS "Public can read user_roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins full access user_roles" ON user_roles;

-- Create policies
CREATE POLICY "Public can read user_roles"
  ON user_roles FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage user_roles"
  ON user_roles FOR ALL
  USING (true);

-- ============================================================================
-- 2. CRÉER/RECRÉER FONCTION is_admin()
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, anon, service_role;

-- ============================================================================
-- 3. CRÉER/RECRÉER FONCTION get_user_role()
-- ============================================================================

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END
  LIMIT 1;

  RETURN COALESCE(user_role, 'customer');
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated, anon, service_role;

-- ============================================================================
-- 4. CRÉER/RECRÉER FONCTION set_user_role()
-- ============================================================================

CREATE OR REPLACE FUNCTION set_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Vérifier que le rôle est valide
  IF new_role NOT IN ('admin', 'customer') THEN
    RAISE EXCEPTION 'Invalid role: %. Must be admin or customer', new_role;
  END IF;

  -- Insérer ou mettre à jour le rôle
  INSERT INTO user_roles (user_id, role, created_at, updated_at)
  VALUES (target_user_id, new_role, now(), now())
  ON CONFLICT (user_id, role)
  DO UPDATE SET updated_at = now();

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error setting user role: %', SQLERRM;
    RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION set_user_role(UUID, TEXT) TO service_role, authenticated, anon;

-- ============================================================================
-- 5. FORCER POSTGREST À RECHARGER LE SCHÉMA
-- ============================================================================

NOTIFY pgrst, 'reload schema';
SELECT pg_notify('pgrst', 'reload config');

-- ============================================================================
-- 6. VÉRIFICATION
-- ============================================================================

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles')
    THEN '✅ Table user_roles créée avec succès'
    ELSE '❌ Erreur: Table user_roles non créée'
  END AS status_table,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_role')
    THEN '✅ Fonction get_user_role() créée'
    ELSE '❌ Fonction get_user_role() manquante'
  END AS status_get_role,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_user_role')
    THEN '✅ Fonction set_user_role() créée'
    ELSE '❌ Fonction set_user_role() manquante'
  END AS status_set_role,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin')
    THEN '✅ Fonction is_admin() créée'
    ELSE '❌ Fonction is_admin() manquante'
  END AS status_is_admin;
