/*
  # RAFRAÎCHISSEMENT BRUTAL POSTGREST - TOUTES TABLES À PROBLÈME

  ## Problème
  Erreurs 400 sur plusieurs tables:
  - weekly_ambassadors
  - customer_reviews
  - live_streams
  - guestbook_entries
  - facebook_reviews

  ## Solution
  Force reload schema pour toutes ces tables via modification DDL
*/

-- NOTIFY initial
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- weekly_ambassadors
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weekly_ambassadors') THEN
    ALTER TABLE weekly_ambassadors ADD COLUMN IF NOT EXISTS _tmp boolean DEFAULT true;
    ALTER TABLE weekly_ambassadors DROP COLUMN IF EXISTS _tmp;
  END IF;
END $$;

-- customer_reviews
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_reviews') THEN
    ALTER TABLE customer_reviews ADD COLUMN IF NOT EXISTS _tmp boolean DEFAULT true;
    ALTER TABLE customer_reviews DROP COLUMN IF EXISTS _tmp;
  END IF;
END $$;

-- live_streams
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'live_streams') THEN
    ALTER TABLE live_streams ADD COLUMN IF NOT EXISTS _tmp boolean DEFAULT true;
    ALTER TABLE live_streams DROP COLUMN IF EXISTS _tmp;
  END IF;
END $$;

-- guestbook_entries
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guestbook_entries') THEN
    ALTER TABLE guestbook_entries ADD COLUMN IF NOT EXISTS _tmp boolean DEFAULT true;
    ALTER TABLE guestbook_entries DROP COLUMN IF EXISTS _tmp;
  END IF;
END $$;

-- facebook_reviews
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'facebook_reviews') THEN
    ALTER TABLE facebook_reviews ADD COLUMN IF NOT EXISTS _tmp boolean DEFAULT true;
    ALTER TABLE facebook_reviews DROP COLUMN IF EXISTS _tmp;
  END IF;
END $$;

-- NOTIFY final (multiple fois pour être sûr)
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
  RAISE NOTICE '[POSTGREST RELOAD] Cache forcé pour 5+ tables';
END $$;
