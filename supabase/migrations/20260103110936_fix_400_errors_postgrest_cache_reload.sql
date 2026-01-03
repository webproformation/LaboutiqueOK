/*
  # Fix 400 Errors - Force PostgREST Cache Reload

  This migration forces PostgREST to reload its schema cache to fix 400 errors
  on tables: weekly_ambassadors, customer_reviews, live_streams, related_products

  ## Actions
  1. Ensure all expected columns exist in each table
  2. Force PostgREST cache reload via DDL changes
  3. Grant proper permissions
  4. Send NOTIFY signals
*/

-- ============================================================================
-- WEEKLY_AMBASSADORS: Ensure all columns exist
-- ============================================================================
DO $$ 
BEGIN
  -- Add is_active if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'weekly_ambassadors' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE weekly_ambassadors ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Force cache reload with comment
COMMENT ON TABLE weekly_ambassadors IS 'Weekly ambassador tracking - Schema updated for PostgREST detection';

-- ============================================================================
-- CUSTOMER_REVIEWS: Ensure all columns exist
-- ============================================================================
DO $$ 
BEGIN
  -- Add source_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_reviews' AND column_name = 'source_id'
  ) THEN
    ALTER TABLE customer_reviews ADD COLUMN source_id text;
  END IF;
  
  -- Add source if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customer_reviews' AND column_name = 'source'
  ) THEN
    ALTER TABLE customer_reviews ADD COLUMN source text DEFAULT 'website';
  END IF;
END $$;

COMMENT ON TABLE customer_reviews IS 'Customer reviews system - Schema updated for PostgREST detection';

-- ============================================================================
-- LIVE_STREAMS: Ensure all columns exist
-- ============================================================================
DO $$ 
BEGIN
  -- Add replay_url if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'live_streams' AND column_name = 'replay_url'
  ) THEN
    ALTER TABLE live_streams ADD COLUMN replay_url text;
  END IF;
END $$;

COMMENT ON TABLE live_streams IS 'Live streaming system - Schema updated for PostgREST detection';

-- ============================================================================
-- RELATED_PRODUCTS: Ensure all columns exist
-- ============================================================================
COMMENT ON TABLE related_products IS 'Related products mapping - Schema updated for PostgREST detection';

-- ============================================================================
-- GUESTBOOK_ENTRIES: Ensure photo_url exists
-- ============================================================================
DO $$ 
BEGIN
  -- Add photo_url if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guestbook_entries' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE guestbook_entries ADD COLUMN photo_url text;
  END IF;
END $$;

COMMENT ON TABLE guestbook_entries IS 'Guestbook entries - Schema updated for PostgREST detection';

-- ============================================================================
-- Grant permissions
-- ============================================================================
GRANT ALL ON weekly_ambassadors TO service_role;
GRANT ALL ON customer_reviews TO service_role;
GRANT ALL ON live_streams TO service_role;
GRANT ALL ON related_products TO service_role;
GRANT ALL ON guestbook_entries TO service_role;

GRANT SELECT ON weekly_ambassadors TO authenticated, anon;
GRANT SELECT ON customer_reviews TO authenticated, anon;
GRANT SELECT ON live_streams TO authenticated, anon;
GRANT SELECT ON related_products TO authenticated, anon;
GRANT SELECT ON guestbook_entries TO authenticated, anon;

-- ============================================================================
-- Force PostgREST reload
-- ============================================================================
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
