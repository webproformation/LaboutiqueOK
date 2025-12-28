/*
  # Ajouter les policies RLS pour les méthodes de livraison

  1. Modifications
    - Activer RLS sur la table shipping_methods si ce n'est pas déjà fait
    - Ajouter une policy pour permettre la lecture publique des méthodes actives
    
  2. Sécurité
    - Seuls les administrateurs peuvent modifier les méthodes de livraison
    - Tout le monde peut lire les méthodes actives (nécessaire pour le checkout)
*/

-- Activer RLS si ce n'est pas déjà fait
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Anyone can read active shipping methods" ON shipping_methods;
DROP POLICY IF EXISTS "Admins can manage shipping methods" ON shipping_methods;

-- Permettre à tout le monde (y compris anonyme) de lire les méthodes de livraison actives
CREATE POLICY "Anyone can read active shipping methods"
  ON shipping_methods FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Permettre aux admins de gérer toutes les méthodes de livraison
CREATE POLICY "Admins can manage shipping methods"
  ON shipping_methods FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
