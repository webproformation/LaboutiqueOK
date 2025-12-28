/*
  # Ajouter l'accès anonyme au panier

  1. Modifications
    - Ajouter des policies RLS pour permettre aux utilisateurs anonymes d'accéder à leur panier
    - Les utilisateurs anonymes peuvent uniquement gérer les items de panier dont le user_id est NULL
    
  2. Sécurité
    - Les utilisateurs anonymes ne peuvent accéder qu'aux items sans user_id
    - Les utilisateurs authentifiés continuent d'accéder uniquement à leurs propres items
*/

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Anonymous users can view items without user_id" ON cart_items;
DROP POLICY IF EXISTS "Anonymous users can insert items without user_id" ON cart_items;
DROP POLICY IF EXISTS "Anonymous users can update items without user_id" ON cart_items;
DROP POLICY IF EXISTS "Anonymous users can delete items without user_id" ON cart_items;

-- Ajouter policy pour que les anonymes puissent voir les items sans user_id
CREATE POLICY "Anonymous users can view items without user_id"
  ON cart_items FOR SELECT
  TO anon
  USING (user_id IS NULL);

-- Ajouter policy pour que les anonymes puissent ajouter des items sans user_id
CREATE POLICY "Anonymous users can insert items without user_id"
  ON cart_items FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Ajouter policy pour que les anonymes puissent modifier les items sans user_id
CREATE POLICY "Anonymous users can update items without user_id"
  ON cart_items FOR UPDATE
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

-- Ajouter policy pour que les anonymes puissent supprimer les items sans user_id
CREATE POLICY "Anonymous users can delete items without user_id"
  ON cart_items FOR DELETE
  TO anon
  USING (user_id IS NULL);
