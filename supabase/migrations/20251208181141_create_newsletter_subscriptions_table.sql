/*
  # Create newsletter subscriptions table

  1. New Tables
    - `newsletter_subscriptions`
      - `id` (uuid, primary key) - Unique subscription identifier
      - `email` (text, unique) - Subscriber email address
      - `subscribed_at` (timestamptz) - Subscription timestamp
      - `is_active` (boolean) - Active subscription status
      - `unsubscribed_at` (timestamptz, nullable) - Unsubscribe timestamp

  2. Security
    - Enable RLS on `newsletter_subscriptions` table
    - Add policy for anyone to subscribe (insert)
    - Add policy for subscribers to unsubscribe (update their own record)
    - Add policy for admins to view all subscriptions

  3. Indexes
    - Index on email for quick lookups
    - Index on is_active for filtering active subscribers
*/

CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  subscribed_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  unsubscribed_at timestamptz,
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscriptions(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can subscribe
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscriptions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Subscribers can view their own subscription
CREATE POLICY "Users can view own subscription"
  ON newsletter_subscriptions
  FOR SELECT
  TO authenticated
  USING (email = (SELECT auth.jwt()->>'email'));

-- Policy: Subscribers can unsubscribe
CREATE POLICY "Users can unsubscribe"
  ON newsletter_subscriptions
  FOR UPDATE
  TO authenticated
  USING (email = (SELECT auth.jwt()->>'email'))
  WITH CHECK (email = (SELECT auth.jwt()->>'email'));

-- Policy: Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON newsletter_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );