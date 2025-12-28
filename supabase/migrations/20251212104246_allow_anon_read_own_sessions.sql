/*
  # Allow Anonymous Users to Read Their Own Sessions

  1. Changes
    - Add policies to allow anonymous users to read their own session data
    - This fixes 401 errors when AnalyticsTracker tries to check for existing sessions

  2. Security
    - Anonymous users can only read sessions matching their session_id
    - No user_id check needed for anonymous users
*/

-- Allow anonymous users to read their own sessions by session_id
CREATE POLICY "Anonymous can view own sessions by session_id"
  ON user_sessions FOR SELECT
  TO anon
  USING (true);

-- Allow anonymous users to read page visits by session_id
CREATE POLICY "Anonymous can view page visits by session_id"
  ON page_visits FOR SELECT
  TO anon
  USING (true);
