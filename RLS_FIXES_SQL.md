# Corrections SQL pour les politiques RLS

Les erreurs 406 que vous rencontrez sont dues à des problèmes de Row Level Security (RLS) lors des jointures entre tables.

## Comment appliquer ces corrections

Allez dans votre dashboard Supabase :
1. Ouvrez https://supabase.com/dashboard/project/ftgclacfleknkqbfbsbs/editor
2. Cliquez sur "SQL Editor" dans le menu de gauche
3. Créez une nouvelle requête et collez le SQL ci-dessous
4. Exécutez la requête

## SQL à exécuter

```sql
-- 1. Corriger l'accès aux guestbook_entries pour weekly_ambassadors
-- Ajouter une policy qui permet de lire les avis référencés par les ambassadrices actives
DROP POLICY IF EXISTS "Everyone can view ambassador entries" ON guestbook_entries;
CREATE POLICY "Everyone can view ambassador entries"
  ON guestbook_entries FOR SELECT
  TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM weekly_ambassadors
      WHERE weekly_ambassadors.guestbook_entry_id = guestbook_entries.id
      AND weekly_ambassadors.is_active = true
    )
  );

-- 2. Améliorer les policies de delivery_batches
-- Permettre aux admins de voir tous les batches
DROP POLICY IF EXISTS "Admins can view all delivery batches" ON delivery_batches;
CREATE POLICY "Admins can view all delivery batches"
  ON delivery_batches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Permettre aux admins de modifier tous les batches
DROP POLICY IF EXISTS "Admins can update all delivery batches" ON delivery_batches;
CREATE POLICY "Admins can update all delivery batches"
  ON delivery_batches FOR UPDATE
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

-- 3. Améliorer les policies de delivery_batch_items pour les admins
DROP POLICY IF EXISTS "Admins can view all batch items" ON delivery_batch_items;
CREATE POLICY "Admins can view all batch items"
  ON delivery_batch_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
```

## Problèmes corrigés

1. **weekly_ambassadors + guestbook_entries (erreur 406)** : Ajout d'une policy pour permettre la lecture des avis liés aux ambassadrices actives
2. **delivery_batches (erreur 406)** : Ajout de policies admin pour voir et modifier tous les batches
3. **user_profiles (erreur 404)** : Corrigé dans le code - remplacé par `profiles` (nom correct de la table)

## Vérification

Après avoir exécuté le SQL, rechargez votre site. Les erreurs 406 devraient disparaître.
