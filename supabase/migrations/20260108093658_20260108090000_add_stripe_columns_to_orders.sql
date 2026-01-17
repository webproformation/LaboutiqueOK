/*
  # Ajout des colonnes Stripe à la table orders

  1. Modifications
    - Ajout stripe_session_id (ID session Stripe Checkout)
    - Ajout stripe_payment_intent (ID PaymentIntent Stripe)
    - Ajout paid_at (date/heure de paiement)

  2. Sécurité
    - RLS déjà activé sur la table orders
    - Policies existantes maintenues
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'stripe_session_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN stripe_session_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'stripe_payment_intent'
  ) THEN
    ALTER TABLE orders ADD COLUMN stripe_payment_intent text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN paid_at timestamptz;
  END IF;
END $$;