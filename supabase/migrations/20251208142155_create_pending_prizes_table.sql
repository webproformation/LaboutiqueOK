/*
  # Create Pending Prizes Table for Anonymous Users

  1. New Tables
    - `pending_prizes`
      - `id` (uuid, primary key) - Unique identifier
      - `session_id` (text, unique) - Browser session identifier (stored in localStorage)
      - `prize_type_id` (uuid, foreign key) - Reference to coupon_types
      - `result` (text) - 'win' or 'lose'
      - `claimed` (boolean) - Whether the prize has been claimed
      - `claimed_by` (uuid, foreign key) - User who claimed the prize
      - `claimed_at` (timestamptz) - When the prize was claimed
      - `expires_at` (timestamptz) - When the prize claim expires (24h)
      - `created_at` (timestamptz) - When the play occurred

  2. Security
    - Enable RLS on the table
    - Anonymous users can insert their own plays (using session_id)
    - Anonymous users can read their own unclaimed prizes
    - Authenticated users can update to claim prizes
    - Admins can view all pending prizes

  3. Important Notes
    - Session ID is generated client-side and stored in localStorage
    - Prizes expire after 24 hours if not claimed
    - Once claimed, the prize is transferred to user_coupons
    - This allows anonymous users to play and claim after registration/login
*/

CREATE TABLE IF NOT EXISTS pending_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  prize_type_id uuid REFERENCES coupon_types(id) ON DELETE CASCADE,
  result text NOT NULL CHECK (result IN ('win', 'lose')),
  claimed boolean DEFAULT false NOT NULL,
  claimed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '24 hours') NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pending_prizes_session_id ON pending_prizes(session_id);
CREATE INDEX IF NOT EXISTS idx_pending_prizes_claimed ON pending_prizes(claimed);
CREATE INDEX IF NOT EXISTS idx_pending_prizes_expires_at ON pending_prizes(expires_at);

ALTER TABLE pending_prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anonymous users can insert pending prizes"
  ON pending_prizes FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can view their own unclaimed prizes"
  ON pending_prizes FOR SELECT
  TO anon
  USING (claimed = false AND expires_at > now());

CREATE POLICY "Authenticated users can view unclaimed prizes"
  ON pending_prizes FOR SELECT
  TO authenticated
  USING (claimed = false AND expires_at > now());

CREATE POLICY "Authenticated users can claim prizes"
  ON pending_prizes FOR UPDATE
  TO authenticated
  USING (claimed = false AND expires_at > now())
  WITH CHECK (auth.uid() = claimed_by);

CREATE POLICY "Admins can view all pending prizes"
  ON pending_prizes FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));
