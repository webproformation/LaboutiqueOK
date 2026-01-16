/*
  # Suppression de la dernière politique insécurisée

  ## Problème détecté
  La politique "Authenticated users can manage post categories" sur news_post_categories
  utilise `USING (true)` et `WITH CHECK (true)` ce qui est non sécurisé.

  ## Solution
  Supprimer cette politique restante car elle est redondante avec les politiques
  sécurisées déjà créées ("Admins can manage post categories").

  ## Sécurité
  Après cette migration, toutes les politiques seront restrictives et basées
  sur la vérification du rôle admin via profiles.is_admin.
*/

-- Supprimer la dernière politique insécurisée
DROP POLICY IF EXISTS "Authenticated users can manage post categories" ON news_post_categories;
