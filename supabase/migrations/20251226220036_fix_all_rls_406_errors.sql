/*
  # Fix All 406 and RLS Errors

  1. Changes
    - Fix weekly_ambassadors relation to guestbook_entries
    - Fix delivery_batches policies for all users
    - Ensure all JOINs work correctly

  2. Security
    - Maintain proper RLS security
    - Allow public read access where needed
*/

-- ============================================
-- FIX 1: Ensure guestbook_entries are readable by everyone for JOINs
-- ============================================

-- Drop conflicting policies
DROP POLICY IF EXISTS "Public can view approved entries with details" ON guestbook_entries;
DROP POLICY IF EXISTS "Public can view approved guestbook entries" ON guestbook_entries;
DROP POLICY IF EXISTS "Everyone can view approved guestbook entries" ON guestbook_entries;

-- Single comprehensive policy for public access
CREATE POLICY "Anyone can view approved guestbook entries"
  ON guestbook_entries FOR SELECT
  USING (status = 'approved');

-- ============================================
-- FIX 2: Fix delivery_batches for all user types
-- ============================================

-- Drop old policies
DROP POLICY IF EXISTS "Anonymous get empty delivery batches" ON delivery_batches;
DROP POLICY IF EXISTS "Anonymous cannot access delivery_batches" ON delivery_batches;
DROP POLICY IF EXISTS "Users can view their own batches" ON delivery_batches;

-- Allow users to view their own batches
CREATE POLICY "Users view own delivery batches"
  ON delivery_batches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anonymous (returns empty but no 406)
CREATE POLICY "Anonymous access delivery batches"
  ON delivery_batches FOR SELECT
  TO anon
  USING (false);

-- ============================================
-- FIX 3: Ensure weekly_ambassadors can be read by everyone
-- ============================================

-- Drop and recreate to ensure clean state
DROP POLICY IF EXISTS "Tous peuvent lire les ambassadrices" ON weekly_ambassadors;
DROP POLICY IF EXISTS "Everyone can read ambassadors" ON weekly_ambassadors;

CREATE POLICY "Public can read weekly ambassadors"
  ON weekly_ambassadors FOR SELECT
  USING (true);
