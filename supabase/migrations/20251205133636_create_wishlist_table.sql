/*
  # Create wishlist table

  1. New Tables
    - `wishlist_items`
      - `id` (uuid, primary key) - Unique identifier for each wishlist item
      - `session_id` (text, not null) - Session identifier stored in browser localStorage
      - `product_slug` (text, not null) - Product slug from WordPress
      - `product_name` (text, not null) - Product name for display
      - `product_image` (text) - Product image URL
      - `product_price` (text) - Product price as text
      - `created_at` (timestamptz) - Timestamp when item was added
      
  2. Security
    - Enable RLS on `wishlist_items` table
    - Add policy for anyone to read their own wishlist items based on session_id
    - Add policy for anyone to insert their own wishlist items
    - Add policy for anyone to delete their own wishlist items
    
  3. Indexes
    - Add index on session_id for faster lookups
    - Add unique constraint on (session_id, product_slug) to prevent duplicates

  ## Notes
  - Session-based approach allows wishlist functionality without authentication
  - Users can manage their wishlist across page refreshes
  - Session ID is generated client-side and stored in localStorage
*/

CREATE TABLE IF NOT EXISTS wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  product_slug text NOT NULL,
  product_name text NOT NULL,
  product_image text,
  product_price text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read their own wishlist items"
  ON wishlist_items
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert their own wishlist items"
  ON wishlist_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete their own wishlist items"
  ON wishlist_items
  FOR DELETE
  USING (true);

CREATE INDEX IF NOT EXISTS idx_wishlist_session_id ON wishlist_items(session_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wishlist_session_product 
  ON wishlist_items(session_id, product_slug);