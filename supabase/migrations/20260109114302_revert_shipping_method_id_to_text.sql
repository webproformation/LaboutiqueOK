/*
  # Annulation de la conversion UUID pour shipping_method_id

  1. Modifications
    - Reconversion de shipping_method_id de UUID vers TEXT
    - Suppression des foreign keys

  2. Raison
    - Les IDs doivent rester en TEXT (format WordPress)
    - Respect strict de l'architecture existante
*/

-- Étape 1: Supprimer les foreign keys
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shipping_method_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_id_fkey;

-- Étape 2: Reconvertir shipping_method_id en TEXT
ALTER TABLE orders
ALTER COLUMN shipping_method_id TYPE text
USING shipping_method_id::text;

-- Étape 3: Supprimer les index UUID
DROP INDEX IF EXISTS idx_orders_shipping_method_id;
DROP INDEX IF EXISTS idx_orders_payment_method_id;

-- Étape 4: Recréer les index pour TEXT
CREATE INDEX IF NOT EXISTS idx_orders_shipping_method_id ON orders(shipping_method_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method_id ON orders(payment_method_id);
