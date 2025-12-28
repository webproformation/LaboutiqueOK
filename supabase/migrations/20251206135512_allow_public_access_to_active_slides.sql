/*
  # Allow Public Access to Active Home Slides

  1. Changes
    - Add policy to allow anonymous users to view active home slides
    - This enables the home page to display slides for non-authenticated users

  2. Security
    - Only active slides are visible to the public
    - Inactive slides and management features remain admin-only
*/

-- Allow anonymous users to view active home slides
CREATE POLICY "Public can view active home slides"
  ON home_slides FOR SELECT
  TO anon
  USING (is_active = true);