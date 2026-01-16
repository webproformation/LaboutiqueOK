/*
  # Complétion du système de commandes

  1. Modifications table orders
    - Ajout payment_method_id
    - Ajout subtotal (sous-total avant frais)
    - Ajout discount_amount (montant remise)
    - Ajout coupon_code (code promo utilisé)
    - Ajout payment_status
    - Ajout notes (notes client)
    - Ajout newsletter_consent (consentement newsletter)
    - Ajout rgpd_consent (consentement RGPD)
    - Ajout is_open_package (commande ajoutée au colis ouvert)

  2. Sécurité
    - RLS déjà activé
    - Policies existantes maintenues
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method_id uuid REFERENCES payment_methods(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE orders ADD COLUMN subtotal numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount_amount numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'coupon_code'
  ) THEN
    ALTER TABLE orders ADD COLUMN coupon_code text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'refunded'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'notes'
  ) THEN
    ALTER TABLE orders ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'newsletter_consent'
  ) THEN
    ALTER TABLE orders ADD COLUMN newsletter_consent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'rgpd_consent'
  ) THEN
    ALTER TABLE orders ADD COLUMN rgpd_consent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'is_open_package'
  ) THEN
    ALTER TABLE orders ADD COLUMN is_open_package boolean DEFAULT false;
  END IF;
END $$;
