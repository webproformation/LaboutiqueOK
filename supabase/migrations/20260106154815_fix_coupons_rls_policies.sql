/*
  # Correction des politiques RLS pour la table coupons

  1. Modifications
    - Suppression de la politique générique "Admins can manage coupons"
    - Création de politiques séparées pour INSERT, UPDATE et DELETE avec WITH CHECK
    - Les admins peuvent maintenant créer, modifier et supprimer des coupons

  2. Sécurité
    - Vérification du rôle admin pour toutes les opérations d'écriture
    - Les utilisateurs anonymes et authentifiés peuvent voir les coupons actifs
*/

-- Supprimer l'ancienne politique qui ne fonctionnait pas correctement
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;

-- Créer des politiques séparées pour chaque opération
CREATE POLICY "Admins can insert coupons"
  ON coupons FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update coupons"
  ON coupons FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete coupons"
  ON coupons FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );
