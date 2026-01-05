/*
  # Create home_categories table for homepage category display

  ## New Tables
  - `home_categories`
    - `id` (uuid, primary key)
    - `category_id` (text, foreign key to categories) - Reference to category
    - `category_slug` (text, required) - Category slug for URL
    - `category_name` (text, required) - Display name of the category
    - `description` (text, optional) - Optional description
    - `display_order` (integer) - Display order on homepage
    - `is_active` (boolean) - Whether the category is shown on homepage
    - `image_url` (text, optional) - Custom image for homepage display
    - `product_count` (integer) - Number of products in category
    - `created_at` (timestamptz) - Creation timestamp
    - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - Enable RLS on `home_categories` table
  - Public can view active categories
  - Only admins can manage categories

  ## Indexes
  - Index on display_order for efficient sorting
  - Index on is_active for filtering active categories
  - Index on category_slug for lookups
*/

-- Create home_categories table
CREATE TABLE IF NOT EXISTS home_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id text REFERENCES categories(id) ON DELETE CASCADE,
  category_slug text NOT NULL,
  category_name text NOT NULL,
  description text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  image_url text,
  product_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_home_categories_display_order ON home_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_home_categories_is_active ON home_categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_home_categories_slug ON home_categories(category_slug);

-- Enable RLS
ALTER TABLE home_categories ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone can view active home categories
CREATE POLICY "Anyone can view active home categories"
  ON home_categories FOR SELECT
  USING (is_active = true);

-- Policies: Admins can view all home categories
CREATE POLICY "Admins can view all home categories"
  ON home_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Policies: Admins can manage home categories
CREATE POLICY "Admins can manage home categories"
  ON home_categories FOR ALL
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

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_home_categories_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_home_categories_timestamp
  BEFORE UPDATE ON home_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_home_categories_updated_at();