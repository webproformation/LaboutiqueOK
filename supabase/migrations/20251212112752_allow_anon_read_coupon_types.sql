/*
  # Allow Anonymous Users to Read Active Coupon Types
  
  1. Changes
    - Add policy to allow anon users to view active coupon types
    - This is needed for the wheel game to display coupon names for non-logged users
    
  2. Security
    - Only allows reading active coupon types
    - No write access for anonymous users
*/

-- Allow anonymous users to view active coupon types
CREATE POLICY "Anonymous users can view active coupon types"
  ON coupon_types
  FOR SELECT
  TO anon
  USING (is_active = true);
