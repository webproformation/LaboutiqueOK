/*
  # Create product availability notifications table

  1. New Tables
    - `product_availability_notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `product_slug` (text)
      - `product_name` (text)
      - `email` (text) - for guest notifications
      - `notified` (boolean, default false)
      - `created_at` (timestamp with time zone)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `product_availability_notifications` table
    - Add policy for authenticated users to create their own notifications
    - Add policy for authenticated users to read their own notifications
    - Add policy for guest users to create notifications (using email)

  3. Indexes
    - Create index on product_slug for faster lookups
    - Create index on user_id for faster user queries
    - Create index on email for guest notifications
*/

CREATE TABLE IF NOT EXISTS product_availability_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_slug text NOT NULL,
  product_name text NOT NULL,
  email text,
  notified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE product_availability_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create their own notifications"
  ON product_availability_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own notifications"
  ON product_availability_notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Guests can create notifications with email"
  ON product_availability_notifications
  FOR INSERT
  TO anon
  WITH CHECK (email IS NOT NULL AND user_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_product_availability_notifications_product_slug
  ON product_availability_notifications(product_slug);

CREATE INDEX IF NOT EXISTS idx_product_availability_notifications_user_id
  ON product_availability_notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_product_availability_notifications_email
  ON product_availability_notifications(email);

CREATE INDEX IF NOT EXISTS idx_product_availability_notifications_notified
  ON product_availability_notifications(notified);
