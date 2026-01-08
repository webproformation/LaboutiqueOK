/*
  # RLS Policies pour Système de Fidélité
  
  Policies de sécurité pour toutes les tables du système de fidélité
*/

-- LOYALTY_WALLET
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'loyalty_wallet' AND policyname = 'Users can view own wallet'
  ) THEN
    CREATE POLICY "Users can view own wallet"
      ON loyalty_wallet FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'loyalty_wallet' AND policyname = 'Users can update own wallet'
  ) THEN
    CREATE POLICY "Users can update own wallet"
      ON loyalty_wallet FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'loyalty_wallet' AND policyname = 'System can insert wallets'
  ) THEN
    CREATE POLICY "System can insert wallets"
      ON loyalty_wallet FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- LOYALTY_TRANSACTIONS_V2
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'loyalty_transactions_v2' AND policyname = 'Users can view own transactions v2'
  ) THEN
    CREATE POLICY "Users can view own transactions v2"
      ON loyalty_transactions_v2 FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'loyalty_transactions_v2' AND policyname = 'System can insert transactions v2'
  ) THEN
    CREATE POLICY "System can insert transactions v2"
      ON loyalty_transactions_v2 FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- DAILY_VISITS
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_visits' AND policyname = 'Users can view own visits'
  ) THEN
    CREATE POLICY "Users can view own visits"
      ON daily_visits FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'daily_visits' AND policyname = 'System can insert visits'
  ) THEN
    CREATE POLICY "System can insert visits"
      ON daily_visits FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- DIAMOND_FINDINGS
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'diamond_findings' AND policyname = 'Users can view own findings'
  ) THEN
    CREATE POLICY "Users can view own findings"
      ON diamond_findings FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'diamond_findings' AND policyname = 'System can insert findings'
  ) THEN
    CREATE POLICY "System can insert findings"
      ON diamond_findings FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- REFERRAL_REWARDS
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'referral_rewards' AND policyname = 'Users can view own referral rewards'
  ) THEN
    CREATE POLICY "Users can view own referral rewards"
      ON referral_rewards FOR SELECT
      TO authenticated
      USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'referral_rewards' AND policyname = 'System can create referral rewards'
  ) THEN
    CREATE POLICY "System can create referral rewards"
      ON referral_rewards FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- CROSS_PLATFORM_COUPONS
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cross_platform_coupons' AND policyname = 'Users can view own cross coupons'
  ) THEN
    CREATE POLICY "Users can view own cross coupons"
      ON cross_platform_coupons FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cross_platform_coupons' AND policyname = 'System can create cross coupons'
  ) THEN
    CREATE POLICY "System can create cross coupons"
      ON cross_platform_coupons FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cross_platform_coupons' AND policyname = 'System can update cross coupons'
  ) THEN
    CREATE POLICY "System can update cross coupons"
      ON cross_platform_coupons FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- REVIEW_REWARDS
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_rewards' AND policyname = 'Users can view own review rewards'
  ) THEN
    CREATE POLICY "Users can view own review rewards"
      ON review_rewards FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_rewards' AND policyname = 'System can create review rewards'
  ) THEN
    CREATE POLICY "System can create review rewards"
      ON review_rewards FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- REVIEW_EMAIL_QUEUE
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_email_queue' AND policyname = 'Admins can view email queue'
  ) THEN
    CREATE POLICY "Admins can view email queue"
      ON review_email_queue FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'review_email_queue' AND policyname = 'System can manage email queue'
  ) THEN
    CREATE POLICY "System can manage email queue"
      ON review_email_queue FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;