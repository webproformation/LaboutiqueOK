/*
  # Système "Mon colis ouvert" (5 jours)

  1. Nouvelles Tables
    - `delivery_batches` : Colis ouverts (groupement de commandes sur 5 jours)
      - `id` (uuid, primary key)
      - `user_id` (uuid, FK vers auth.users)
      - `shipping_cost` (numeric) - Frais de port payés lors de la création
      - `shipping_address_id` (uuid, FK vers addresses)
      - `shipping_method_id` (text)
      - `status` (text : pending, validated, shipped, delivered, cancelled)
      - `validate_at` (timestamptz) - Date limite de validation (created_at + 5 jours)
      - `validated_at` (timestamptz) - Date de validation effective
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `delivery_batch_items` : Articles dans chaque colis ouvert
      - `id` (uuid, primary key)
      - `batch_id` (uuid, FK vers delivery_batches)
      - `product_id` (text)
      - `product_name` (text)
      - `product_slug` (text)
      - `quantity` (integer)
      - `unit_price` (numeric)
      - `total_price` (numeric)
      - `image_url` (text)
      - `variation_data` (jsonb)
      - `order_id` (uuid) - Référence à la commande qui a ajouté cet article
      - `created_at` (timestamptz)

  2. Concept
    - L'utilisateur peut activer "Mon colis ouvert" au checkout
    - Première commande : paye produits + frais de port + assurance
    - Commandes suivantes (dans les 5 jours) : paye uniquement produits + assurance (frais de port = 0€)
    - Après 5 jours OU validation manuelle : le colis est expédié

  3. Sécurité
    - Enable RLS
    - Users peuvent uniquement gérer leurs propres colis
*/

-- Table delivery_batches
CREATE TABLE IF NOT EXISTS delivery_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shipping_cost numeric(10,2) NOT NULL DEFAULT 0,
  shipping_address_id uuid REFERENCES addresses(id) ON DELETE SET NULL,
  shipping_method_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'shipped', 'delivered', 'cancelled')),
  validate_at timestamptz NOT NULL,
  validated_at timestamptz,
  relay_point_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their delivery batches"
  ON delivery_batches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their delivery batches"
  ON delivery_batches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their delivery batches"
  ON delivery_batches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Table delivery_batch_items
CREATE TABLE IF NOT EXISTS delivery_batch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES delivery_batches(id) ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_slug text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(10,2) NOT NULL,
  image_url text,
  variation_data jsonb,
  order_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE delivery_batch_items ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can insert items in their batches"
  ON delivery_batch_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM delivery_batches
      WHERE delivery_batches.id = delivery_batch_items.batch_id
      AND delivery_batches.user_id = auth.uid()
    )
  );

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_delivery_batches_user_id ON delivery_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_batches_status ON delivery_batches(status);
CREATE INDEX IF NOT EXISTS idx_delivery_batch_items_batch_id ON delivery_batch_items(batch_id);

-- Fonction pour auto-valider les colis après 5 jours
CREATE OR REPLACE FUNCTION auto_validate_expired_batches()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE delivery_batches
  SET status = 'validated',
      validated_at = now(),
      updated_at = now()
  WHERE status = 'pending'
    AND validate_at <= now();
END;
$$;
