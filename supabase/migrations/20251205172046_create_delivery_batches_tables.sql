/*
  # Système de livraison différée avec regroupement de commandes

  1. Nouvelles Tables
    - `delivery_batches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `status` (text) : 'pending', 'validated', 'cancelled'
      - `created_at` (timestamptz) : Date de création du batch
      - `validate_at` (timestamptz) : Date de validation automatique (created_at + 5 jours)
      - `validated_at` (timestamptz) : Date de validation effective
      - `shipping_cost` (numeric) : Frais de livraison pour le batch
      - `shipping_address_id` (uuid, foreign key to addresses)
      - `woocommerce_order_id` (text) : ID de la commande WooCommerce créée
      
    - `delivery_batch_items`
      - `id` (uuid, primary key)
      - `batch_id` (uuid, foreign key to delivery_batches)
      - `product_id` (text) : ID du produit WooCommerce
      - `product_name` (text)
      - `product_slug` (text)
      - `quantity` (integer)
      - `unit_price` (numeric)
      - `total_price` (numeric)
      - `created_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Policies pour que les utilisateurs ne voient que leurs propres batches
    
  3. Notes importantes
    - Les frais de livraison sont calculés une seule fois pour tout le batch
    - Les commandes ajoutées dans les 5 jours rejoignent le batch existant
    - La validation peut être manuelle ou automatique après 5 jours
*/

-- Table des lots de livraison
CREATE TABLE IF NOT EXISTS delivery_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  validate_at timestamptz NOT NULL DEFAULT (now() + interval '5 days'),
  validated_at timestamptz,
  shipping_cost numeric(10, 2) NOT NULL DEFAULT 0,
  shipping_address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
  woocommerce_order_id text,
  notes text
);

-- Table des articles dans les lots
CREATE TABLE IF NOT EXISTS delivery_batch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES delivery_batches(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_slug text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(10, 2) NOT NULL,
  total_price numeric(10, 2) NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_delivery_batches_user_id ON delivery_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_batches_status ON delivery_batches(status);
CREATE INDEX IF NOT EXISTS idx_delivery_batches_validate_at ON delivery_batches(validate_at);
CREATE INDEX IF NOT EXISTS idx_delivery_batch_items_batch_id ON delivery_batch_items(batch_id);

-- Enable RLS
ALTER TABLE delivery_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_batch_items ENABLE ROW LEVEL SECURITY;

-- Policies pour delivery_batches
CREATE POLICY "Users can view their own delivery batches"
  ON delivery_batches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own delivery batches"
  ON delivery_batches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own delivery batches"
  ON delivery_batches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own delivery batches"
  ON delivery_batches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies pour delivery_batch_items
CREATE POLICY "Users can view items in their batches"
  ON delivery_batch_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_batches
      WHERE delivery_batches.id = delivery_batch_items.batch_id
      AND delivery_batches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add items to their batches"
  ON delivery_batch_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_batches
      WHERE delivery_batches.id = delivery_batch_items.batch_id
      AND delivery_batches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their batches"
  ON delivery_batch_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_batches
      WHERE delivery_batches.id = delivery_batch_items.batch_id
      AND delivery_batches.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_batches
      WHERE delivery_batches.id = delivery_batch_items.batch_id
      AND delivery_batches.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their batches"
  ON delivery_batch_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM delivery_batches
      WHERE delivery_batches.id = delivery_batch_items.batch_id
      AND delivery_batches.user_id = auth.uid()
    )
  );
