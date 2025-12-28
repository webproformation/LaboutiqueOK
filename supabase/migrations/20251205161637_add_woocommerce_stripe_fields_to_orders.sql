/*
  # Add WooCommerce and Stripe fields to orders table

  1. Changes
    - Add `woocommerce_order_id` column to store WooCommerce order ID
    - Add `woocommerce_order_number` column to store WooCommerce order number
    - Add `stripe_payment_intent_id` column to store Stripe payment intent ID
    - Add `shipping_method_id` column to store selected shipping method
    - Add `shipping_cost` column to store shipping cost
    - Add `tax_amount` column to store tax amount
    - Add `invoice_url` column to store invoice PDF URL from WooCommerce
    
  2. Notes
    - These fields enable synchronization with WooCommerce
    - Invoice URLs will be fetched from WooCommerce after order creation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'woocommerce_order_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN woocommerce_order_id integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'woocommerce_order_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN woocommerce_order_number text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'stripe_payment_intent_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN stripe_payment_intent_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_method_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_method_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'shipping_cost'
  ) THEN
    ALTER TABLE orders ADD COLUMN shipping_cost decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'tax_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN tax_amount decimal(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'invoice_url'
  ) THEN
    ALTER TABLE orders ADD COLUMN invoice_url text;
  END IF;
END $$;