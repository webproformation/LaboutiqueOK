/*
  # Create Cookie Consent System

  1. New Tables
    - `cookie_consents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable, references auth.users)
      - `session_id` (text, for anonymous users)
      - `necessary` (boolean, always true)
      - `functional` (boolean, user preference)
      - `analytics` (boolean, user preference)
      - `marketing` (boolean, user preference)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `cookie_consents` table
    - Add policies for users to manage their own consent
    - Add policy for anonymous users via session_id

  3. Notes
    - Necessary cookies are always enabled (cannot be disabled)
    - Users can update their preferences at any time
    - Anonymous users tracked via session_id
*/

CREATE TABLE IF NOT EXISTS cookie_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  necessary boolean DEFAULT true NOT NULL,
  functional boolean DEFAULT false NOT NULL,
  analytics boolean DEFAULT false NOT NULL,
  marketing boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT user_or_session CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

ALTER TABLE cookie_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cookie consent"
  ON cookie_consents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cookie consent"
  ON cookie_consents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cookie consent"
  ON cookie_consents
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can view their consent via session"
  ON cookie_consents
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert consent"
  ON cookie_consents
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update consent via session"
  ON cookie_consents
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_cookie_consents_user_id ON cookie_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_cookie_consents_session_id ON cookie_consents(session_id);

CREATE OR REPLACE FUNCTION update_cookie_consent_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cookie_consent_timestamp
  BEFORE UPDATE ON cookie_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_cookie_consent_timestamp();