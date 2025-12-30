/*
  # Force PostgREST reload for loyalty_points table

  1. Problem
    - loyalty_points table returns 400 errors despite correct RLS policies
    - PostgREST cache is stuck and not recognizing the table

  2. Solution
    - Add a temporary column to force schema change detection
    - Drop it immediately
    - Update table comment to force reload
    - Send NOTIFY to PostgREST
*/

-- Add a temporary column to force schema change
ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS temp_force_reload BOOLEAN DEFAULT NULL;

-- Drop it immediately
ALTER TABLE loyalty_points DROP COLUMN IF EXISTS temp_force_reload;

-- Update table comment with timestamp
COMMENT ON TABLE loyalty_points IS 'Loyalty points tracking - Force reload at 2025-12-30 20:30:00';

-- Update all column comments to force schema detection
COMMENT ON COLUMN loyalty_points.id IS 'Primary key - Updated 2025-12-30 20:30:00';
COMMENT ON COLUMN loyalty_points.user_id IS 'User reference - Updated 2025-12-30 20:30:00';
COMMENT ON COLUMN loyalty_points.page_visit_points IS 'Points from page visits - Updated 2025-12-30 20:30:00';
COMMENT ON COLUMN loyalty_points.live_participation_count IS 'Live participation count - Updated 2025-12-30 20:30:00';

-- Verify and recreate RLS policies with different names to force reload
DROP POLICY IF EXISTS "loyalty_points_all_select" ON loyalty_points;
DROP POLICY IF EXISTS "loyalty_points_all_insert" ON loyalty_points;
DROP POLICY IF EXISTS "loyalty_points_all_update" ON loyalty_points;
DROP POLICY IF EXISTS "loyalty_points_all_delete" ON loyalty_points;

-- Create policies with v2 suffix
CREATE POLICY "loyalty_points_select_v2"
  ON loyalty_points
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "loyalty_points_insert_v2"
  ON loyalty_points
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "loyalty_points_update_v2"
  ON loyalty_points
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "loyalty_points_delete_v2"
  ON loyalty_points
  FOR DELETE
  TO public
  USING (true);

-- Verify RLS is enabled
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

-- Force PostgREST schema reload
NOTIFY pgrst, 'reload schema';
