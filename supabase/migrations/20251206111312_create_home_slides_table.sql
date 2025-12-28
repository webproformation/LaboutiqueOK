/*
  # Create Home Slides Table

  1. New Tables
    - `home_slides`
      - `id` (uuid, primary key)
      - `title` (text)
      - `subtitle` (text)
      - `image_url` (text)
      - `link_url` (text)
      - `order_position` (integer)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `home_slides` table
    - Public read access for active slides
    - Admin-only write access
  
  3. Notes
    - Slides are displayed on homepage in order_position order
    - Only active slides are shown to public
*/

-- Create home_slides table
CREATE TABLE IF NOT EXISTS home_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  link_url text,
  order_position integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE home_slides ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active slides"
  ON home_slides FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all slides"
  ON home_slides FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert slides"
  ON home_slides FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update slides"
  ON home_slides FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete slides"
  ON home_slides FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_home_slides_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_home_slides_timestamp'
  ) THEN
    CREATE TRIGGER update_home_slides_timestamp
      BEFORE UPDATE ON home_slides
      FOR EACH ROW
      EXECUTE FUNCTION update_home_slides_updated_at();
  END IF;
END $$;