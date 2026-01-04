/*
  # Create Scratch Game Prizes Configuration Table

  1. New Tables
    - `scratch_game_prizes`
      - `id` (uuid, primary key) - Unique identifier
      - `coupon_type_id` (uuid, foreign key) - Reference to coupon_types
      - `weight` (integer) - Relative weight for prize selection (higher = more likely)
      - `is_active` (boolean) - Whether this prize is currently active
      - `created_at` (timestamptz) - When the prize was added
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on the table
    - Public can read active prizes (needed for game logic)
    - Only admins can manage prizes

  3. Important Notes
    - Prizes are selected based on weight when a user wins
    - Higher weight = higher chance of being selected
    - Example: weight 10 is twice as likely as weight 5
    - Only active prizes are considered for selection
*/

CREATE TABLE IF NOT EXISTS scratch_game_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_type_id uuid REFERENCES coupon_types(id) ON DELETE CASCADE NOT NULL,
  weight integer DEFAULT 1 NOT NULL CHECK (weight > 0),
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Ensure one coupon type can only be added once
CREATE UNIQUE INDEX IF NOT EXISTS idx_scratch_game_prizes_coupon_type
  ON scratch_game_prizes(coupon_type_id);

CREATE INDEX IF NOT EXISTS idx_scratch_game_prizes_active
  ON scratch_game_prizes(is_active);

ALTER TABLE scratch_game_prizes ENABLE ROW LEVEL SECURITY;

-- Public can view active prizes for game logic
CREATE POLICY "Anyone can view active scratch game prizes"
  ON scratch_game_prizes FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admins can manage prizes
CREATE POLICY "Admins can insert scratch game prizes"
  ON scratch_game_prizes FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update scratch game prizes"
  ON scratch_game_prizes FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete scratch game prizes"
  ON scratch_game_prizes FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can view all scratch game prizes"
  ON scratch_game_prizes FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scratch_game_prizes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scratch_game_prizes_updated_at ON scratch_game_prizes;
CREATE TRIGGER scratch_game_prizes_updated_at
  BEFORE UPDATE ON scratch_game_prizes
  FOR EACH ROW
  EXECUTE FUNCTION update_scratch_game_prizes_updated_at();