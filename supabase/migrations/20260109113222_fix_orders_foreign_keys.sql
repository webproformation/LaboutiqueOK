/*
  # Correction des clés étrangères pour orders

  1. Modifications
    - Conversion de shipping_method_id de TEXT vers UUID
    - Ajout de la foreign key vers shipping_methods(id)
    - Vérification de la foreign key vers payment_methods(id)

  2. Relations créées
    - orders.shipping_method_id → shipping_methods(id)
    - orders.payment_method_id → payment_methods(id)

  3. Impact
    - Permet les jointures automatiques avec Supabase
    - Fixe l'erreur 400 sur les requêtes orders avec jointures
*/

-- Étape 1: Supprimer les valeurs non-UUID de shipping_method_id
UPDATE orders
SET shipping_method_id = NULL
WHERE shipping_method_id IS NOT NULL
  AND shipping_method_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Étape 2: Convertir la colonne de TEXT vers UUID
DO $$
BEGIN
  -- Vérifier si la colonne existe et est de type TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders'
    AND column_name = 'shipping_method_id'
    AND data_type = 'text'
  ) THEN
    -- Convertir en UUID avec USING pour gérer la conversion
    ALTER TABLE orders
    ALTER COLUMN shipping_method_id TYPE uuid
    USING CASE
      WHEN shipping_method_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      THEN shipping_method_id::uuid
      ELSE NULL
    END;

    RAISE NOTICE 'Colonne shipping_method_id convertie de TEXT vers UUID';
  END IF;
END $$;

-- Étape 3: Ajouter la foreign key vers shipping_methods si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_shipping_method_id_fkey'
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_shipping_method_id_fkey
    FOREIGN KEY (shipping_method_id)
    REFERENCES shipping_methods(id)
    ON DELETE SET NULL;

    RAISE NOTICE 'Foreign key orders_shipping_method_id_fkey créée';
  END IF;
END $$;

-- Étape 4: Vérifier et ajouter la foreign key vers payment_methods si nécessaire
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_payment_method_id_fkey'
    AND table_name = 'orders'
  ) THEN
    ALTER TABLE orders
    ADD CONSTRAINT orders_payment_method_id_fkey
    FOREIGN KEY (payment_method_id)
    REFERENCES payment_methods(id)
    ON DELETE SET NULL;

    RAISE NOTICE 'Foreign key orders_payment_method_id_fkey créée';
  END IF;
END $$;

-- Étape 5: Créer des index pour optimiser les jointures
CREATE INDEX IF NOT EXISTS idx_orders_shipping_method_id ON orders(shipping_method_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method_id ON orders(payment_method_id);

-- Étape 6: Rafraîchir le cache de schéma (commentaire informatif)
-- Les foreign keys sont maintenant configurées et Supabase pourra effectuer les jointures automatiques
-- Utilisation: .select('*, shipping_method:shipping_methods(*), payment_method:payment_methods(*)')
