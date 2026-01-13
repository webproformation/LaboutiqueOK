/*
  # Ajout des policies INSERT pour orders et order_items

  1. Modifications
    - Ajout policy INSERT pour table orders (utilisateurs authentifiés)
    - Ajout policy INSERT pour table order_items (utilisateurs authentifiés)

  2. Sécurité
    - Les utilisateurs authentifiés peuvent créer leurs propres commandes
    - Les utilisateurs peuvent ajouter des items uniquement à leurs propres commandes
*/

-- Policy INSERT pour la table orders
CREATE POLICY "Users can create their own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy INSERT pour la table order_items
CREATE POLICY "Users can add items to their orders"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );
