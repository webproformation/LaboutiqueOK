/*
  # Clean duplicate RLS policies on analytics tables

  This migration removes all duplicate RLS policies on user_sessions and page_visits tables,
  then creates a single simple policy for each operation type.

  1. Actions taken:
    - Drop all existing policies on user_sessions
    - Drop all existing policies on page_visits
    - Create one simple policy per operation (SELECT, INSERT, UPDATE, DELETE)
    - Force PostgREST cache reload
*/

-- 1. Clean user_sessions policies
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'user_sessions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON user_sessions', pol.policyname);
  END LOOP;
  RAISE NOTICE 'Cleaned all policies from user_sessions';
END $$;

-- 2. Clean page_visits policies
DO $$ 
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'page_visits'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON page_visits', pol.policyname);
  END LOOP;
  RAISE NOTICE 'Cleaned all policies from page_visits';
END $$;

-- 3. Create simple policies for user_sessions
CREATE POLICY "service_role_all_user_sessions"
  ON user_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "public_select_user_sessions"
  ON user_sessions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "public_insert_user_sessions"
  ON user_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "public_update_user_sessions"
  ON user_sessions
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "public_delete_user_sessions"
  ON user_sessions
  FOR DELETE
  TO public
  USING (true);

-- 4. Create simple policies for page_visits
CREATE POLICY "service_role_all_page_visits"
  ON page_visits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "public_select_page_visits"
  ON page_visits
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "public_insert_page_visits"
  ON page_visits
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "public_update_page_visits"
  ON page_visits
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "public_delete_page_visits"
  ON page_visits
  FOR DELETE
  TO public
  USING (true);

-- 5. Force schema change detection
DO $$ 
BEGIN
  ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS temp_col TEXT DEFAULT NULL;
  ALTER TABLE user_sessions DROP COLUMN IF EXISTS temp_col;
  
  ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS temp_col TEXT DEFAULT NULL;
  ALTER TABLE page_visits DROP COLUMN IF EXISTS temp_col;
  
  RAISE NOTICE 'Schema changes triggered';
END $$;

-- 6. Send NOTIFY to PostgREST
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
  PERFORM pg_notify('pgrst', 'reload config');
  RAISE NOTICE 'PostgREST notified';
END $$;

-- 7. Verify final state
DO $$
DECLARE
  sessions_count INTEGER;
  visits_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO sessions_count FROM pg_policies WHERE tablename = 'user_sessions';
  SELECT COUNT(*) INTO visits_count FROM pg_policies WHERE tablename = 'page_visits';
  
  RAISE NOTICE '✓ user_sessions policies: %', sessions_count;
  RAISE NOTICE '✓ page_visits policies: %', visits_count;
  
  IF sessions_count = 0 OR visits_count = 0 THEN
    RAISE EXCEPTION 'Policies were not created correctly!';
  END IF;
END $$;
