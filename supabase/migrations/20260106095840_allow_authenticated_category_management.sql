/*
  # Autoriser les utilisateurs authentifiés à gérer les catégories
  
  1. Problème
    - Aucun utilisateur n'existe encore dans la base
    - Les politiques vérifient is_admin mais pas de profil créé
  
  2. Solution temporaire pour développement
    - Permettre à tout utilisateur authentifié de gérer les catégories
    - À restreindre plus tard aux admins uniquement si nécessaire
*/

-- Supprimer les politiques admin
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

-- Permettre à tous les utilisateurs authentifiés (temporaire)
CREATE POLICY "Authenticated users can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (true);