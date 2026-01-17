/*
  # Diagnostic temporaire pour home_categories RLS

  ## Problème
  Erreur 403 persistante même pour les admins authentifiés.

  ## Test
  - Ajouter une politique SELECT permissive temporaire pour TOUS les utilisateurs authentifiés
  - Cela permettra de déterminer si le problème vient de :
    1. La vérification du statut admin (is_admin)
    2. Le token JWT non transmis
    3. Autre problème RLS

  ## IMPORTANT
  Cette politique est TEMPORAIRE et doit être supprimée après diagnostic.
*/

-- Ajouter une politique temporaire très permissive pour diagnostic
CREATE POLICY "TEMP - All authenticated can view home categories"
  ON home_categories FOR SELECT
  TO authenticated
  USING (true);
