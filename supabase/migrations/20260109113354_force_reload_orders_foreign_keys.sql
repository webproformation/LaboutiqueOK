/*
  # Forcer le reload du cache PostgREST pour les foreign keys orders

  1. Action
    - Drop et recréation des foreign keys pour déclencher un événement DDL
    - Ceci force PostgREST à recharger son cache de schéma

  2. Impact
    - Fixe l'erreur PGRST200 du cache de schéma
*/

-- Drop et recréation pour déclencher un événement DDL
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_shipping_method_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_method_id_fkey;

-- Recréer immédiatement
ALTER TABLE orders
ADD CONSTRAINT orders_shipping_method_id_fkey
FOREIGN KEY (shipping_method_id)
REFERENCES shipping_methods(id)
ON DELETE SET NULL;

ALTER TABLE orders
ADD CONSTRAINT orders_payment_method_id_fkey
FOREIGN KEY (payment_method_id)
REFERENCES payment_methods(id)
ON DELETE SET NULL;

-- Notification explicite
NOTIFY pgrst, 'reload schema';
