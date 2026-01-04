/*
  # Create News Categories System

  1. New Tables
    - `news_categories`
      - `id` (uuid, primary key) - Unique identifier
      - `wordpress_id` (integer, unique) - WordPress category ID
      - `name` (text) - Category name
      - `slug` (text, unique) - URL-friendly slug
      - `description` (text) - Category description
      - `parent_id` (uuid, nullable) - Parent category for hierarchical structure
      - `count` (integer) - Number of posts in category
      - `is_active` (boolean) - Whether the category is active
      - `display_order` (integer) - Sort order for display
      - `color` (text) - Badge color for category display
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on the table
    - Public can read active categories
    - Only admins can manage categories

  3. Important Notes
    - Categories are synced with WordPress
    - Supports hierarchical categories with parent_id
    - Display order allows custom sorting
    - Color field for visual identification
*/

CREATE TABLE IF NOT EXISTS news_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_id integer UNIQUE,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text DEFAULT '',
  parent_id uuid REFERENCES news_categories(id) ON DELETE SET NULL,
  count integer DEFAULT 0 NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  display_order integer DEFAULT 0 NOT NULL,
  color text DEFAULT '#b8933d',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_news_categories_wordpress_id ON news_categories(wordpress_id);
CREATE INDEX IF NOT EXISTS idx_news_categories_slug ON news_categories(slug);
CREATE INDEX IF NOT EXISTS idx_news_categories_active ON news_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_news_categories_parent_id ON news_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_news_categories_display_order ON news_categories(display_order);

ALTER TABLE news_categories ENABLE ROW LEVEL SECURITY;

-- Public can view active categories
CREATE POLICY "Anyone can view active news categories"
  ON news_categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admins can view all categories
CREATE POLICY "Admins can view all news categories"
  ON news_categories FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins can manage categories
CREATE POLICY "Admins can insert news categories"
  ON news_categories FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update news categories"
  ON news_categories FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete news categories"
  ON news_categories FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_news_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS news_categories_updated_at ON news_categories;
CREATE TRIGGER news_categories_updated_at
  BEFORE UPDATE ON news_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_news_categories_updated_at();
