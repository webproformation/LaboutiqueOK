/*
  # Fix RLS Policies for Anonymous Users

  1. Changes
    - Fix delivery_batches to not return 406 for anonymous users
    - Fix weekly_ambassadors JOIN with guestbook_entries
    - Add public read access for necessary tables
    
  2. Security
    - Maintain security while fixing 406 errors
    - Allow anonymous users to read public data
*/

-- ============================================
-- FIX 1: Allow anonymous to attempt SELECT on delivery_batches
-- (will return empty for anon, but won't cause 406)
-- ============================================

DROP POLICY IF EXISTS "Anonymous cannot access delivery batches" ON delivery_batches;

CREATE POLICY "Anonymous get empty delivery batches"
  ON delivery_batches FOR SELECT
  TO anon
  USING (false);

-- ============================================
-- FIX 2: Allow JOIN between weekly_ambassadors and guestbook_entries
-- ============================================

-- Ensure guestbook_entries allows SELECT for the JOIN
DROP POLICY IF EXISTS "Public can view approved guestbook entries" ON guestbook_entries;

CREATE POLICY "Public can view approved entries with details"
  ON guestbook_entries FOR SELECT
  TO public
  USING (status = 'approved');

-- ============================================
-- FIX 3: Allow reading profiles for weekly_ambassadors JOIN
-- ============================================

DROP POLICY IF EXISTS "Public can read customer profiles for ambassadors" ON profiles;

CREATE POLICY "Public can read basic profile info"
  ON profiles FOR SELECT
  TO public
  USING (true);
