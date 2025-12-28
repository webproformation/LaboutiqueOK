/*
  # Support des avis Facebook dans le livre d'or

  1. Modifications
    - Ajouter un champ `source` pour identifier l'origine de l'avis (site, facebook)
    - Rendre `user_id` et `order_id` optionnels pour les avis Facebook
    - Ajouter `facebook_review_date` pour la date originale de l'avis Facebook
    - Modifier la contrainte UNIQUE pour ne s'appliquer qu'aux avis du site

  2. Sécurité
    - Les admins peuvent créer des avis Facebook
    - Les avis Facebook sont automatiquement approuvés
*/

-- Ajouter les nouveaux champs
ALTER TABLE guestbook_entries
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'site' CHECK (source IN ('site', 'facebook')),
  ADD COLUMN IF NOT EXISTS facebook_review_date timestamptz;

-- Rendre user_id et order_id optionnels
ALTER TABLE guestbook_entries
  ALTER COLUMN user_id DROP NOT NULL,
  ALTER COLUMN order_id DROP NOT NULL;

-- Supprimer l'ancienne contrainte UNIQUE sur order_id
ALTER TABLE guestbook_entries
  DROP CONSTRAINT IF EXISTS guestbook_entries_order_id_key;

-- Ajouter une nouvelle contrainte UNIQUE qui ne s'applique qu'aux avis du site
CREATE UNIQUE INDEX IF NOT EXISTS guestbook_entries_site_order_unique
  ON guestbook_entries(order_id)
  WHERE source = 'site' AND order_id IS NOT NULL;

-- Ajouter un index sur la source
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_source ON guestbook_entries(source);

-- Policy pour permettre aux admins de créer des avis Facebook
CREATE POLICY "Admins can create Facebook reviews"
  ON guestbook_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
    AND source = 'facebook'
  );