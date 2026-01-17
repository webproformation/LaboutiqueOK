/*
  # Create home_slides table for homepage carousel

  ## New Tables
  - `home_slides`
    - `id` (uuid, primary key)
    - `title` (text, required) - Main slide title
    - `subtitle` (text, optional) - Subtitle or description
    - `image_url` (text, required) - URL of the slide image
    - `link_url` (text, optional) - Optional link when slide is clicked
    - `button_text` (text, optional) - CTA button text
    - `button_url` (text, optional) - CTA button URL
    - `order_position` (integer) - Display order of slides
    - `is_active` (boolean) - Whether the slide is active/visible
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on `home_slides` table
  - Public can view active slides
  - Only admins can manage slides

  ## Indexes
  - Index on order_position for efficient sorting
  - Index on is_active for filtering active slides
*/

-- Create home_slides table
CREATE TABLE IF NOT EXISTS home_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  link_url text,
  button_text text,
  button_url text,
  order_position integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_home_slides_order ON home_slides(order_position);
CREATE INDEX IF NOT EXISTS idx_home_slides_active ON home_slides(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE home_slides ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can view active slides
CREATE POLICY "Anyone can view active slides"
  ON home_slides FOR SELECT
  USING (is_active = true);

-- Policies: Admins can view all slides
CREATE POLICY "Admins can view all slides"
  ON home_slides FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policies: Admins can insert slides
CREATE POLICY "Admins can insert slides"
  ON home_slides FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policies: Admins can update slides
CREATE POLICY "Admins can update slides"
  ON home_slides FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policies: Admins can delete slides
CREATE POLICY "Admins can delete slides"
  ON home_slides FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_home_slides_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_home_slides_timestamp
  BEFORE UPDATE ON home_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_home_slides_updated_at();

-- Insert default slides
INSERT INTO home_slides (title, subtitle, image_url, button_text, button_url, order_position, is_active)
VALUES 
  ('Nouvelle Collection', 'Découvrez les dernières tendances mode', 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=1920', 'Découvrir', '/categorie/nouveautes', 0, true),
  ('Les Looks de Morgane', 'Inspirez-vous de nos sélections', 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=1920', 'Voir les looks', '/les-looks-de-morgane', 1, true),
  ('Beautés & Soins', 'Prenez soin de vous', 'https://images.pexels.com/photos/1488463/pexels-photo-1488463.jpeg?auto=compress&cs=tinysrgb&w=1920', 'Explorer', '/categorie/beaute-senteurs', 2, true);