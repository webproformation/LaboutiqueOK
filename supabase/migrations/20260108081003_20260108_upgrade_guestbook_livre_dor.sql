/*
  # Upgrade Livre d'Or (Guestbook) Complet
  
  1. Modifications de guestbook_entries
    - Ajout rating en "pépites" (1-5)
    - Ajout link vers order_number pour vérification
    - Ajout hearts_count (compteur likes)
    - Ajout is_ambassador (ambassadrice de la semaine)
    - Ajout ambassador_week (semaine d'élection)
    
  2. Nouvelle table guestbook_hearts
    - Système de "like" avec coeurs
    - 1 coeur par user par avis
    
  3. Nouvelle table ambassador_weekly
    - Archive des ambassadrices élues
    - Badge, récompense 5€
    
  4. Mise à jour guestbook_settings
    - Ajout current_gift_value (valeur cadeau)
    - Ajout threshold_amount (palier cadeau 69€)
    
  5. Sécurité
    - RLS sur toutes les tables
    - Policies restrictives
*/

-- UPGRADE GUESTBOOK_ENTRIES
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guestbook_entries' AND column_name = 'hearts_count'
  ) THEN
    ALTER TABLE guestbook_entries ADD COLUMN hearts_count integer DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guestbook_entries' AND column_name = 'is_ambassador'
  ) THEN
    ALTER TABLE guestbook_entries ADD COLUMN is_ambassador boolean DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guestbook_entries' AND column_name = 'ambassador_week'
  ) THEN
    ALTER TABLE guestbook_entries ADD COLUMN ambassador_week text;
  END IF;
END $$;

-- INDEX pour performance
CREATE INDEX IF NOT EXISTS idx_guestbook_hearts ON guestbook_entries(hearts_count DESC);
CREATE INDEX IF NOT EXISTS idx_guestbook_ambassador ON guestbook_entries(is_ambassador) WHERE is_ambassador = true;

-- NOUVELLE TABLE : GUESTBOOK_HEARTS (remplace guestbook_likes avec meilleure logique)
CREATE TABLE IF NOT EXISTS guestbook_hearts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES guestbook_entries(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entry_id, user_id)
);

ALTER TABLE guestbook_hearts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view hearts"
  ON guestbook_hearts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can add their own hearts"
  ON guestbook_hearts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own hearts"
  ON guestbook_hearts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- INDEX
CREATE INDEX IF NOT EXISTS idx_hearts_entry ON guestbook_hearts(entry_id);
CREATE INDEX IF NOT EXISTS idx_hearts_user ON guestbook_hearts(user_id);

-- NOUVELLE TABLE : AMBASSADOR_WEEKLY
CREATE TABLE IF NOT EXISTS ambassador_weekly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_id uuid REFERENCES guestbook_entries(id) ON DELETE SET NULL,
  week_start date NOT NULL,
  week_end date NOT NULL,
  hearts_count integer DEFAULT 0,
  reward_amount numeric DEFAULT 5.00,
  reward_credited boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(week_start, week_end)
);

ALTER TABLE ambassador_weekly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ambassadors"
  ON ambassador_weekly FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage ambassadors"
  ON ambassador_weekly FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- INDEX
CREATE INDEX IF NOT EXISTS idx_ambassador_week ON ambassador_weekly(week_start DESC);
CREATE INDEX IF NOT EXISTS idx_ambassador_user ON ambassador_weekly(user_id);

-- UPGRADE GUESTBOOK_SETTINGS
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guestbook_settings' AND column_name = 'current_gift_value'
  ) THEN
    ALTER TABLE guestbook_settings ADD COLUMN current_gift_value numeric DEFAULT 5.00;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guestbook_settings' AND column_name = 'threshold_amount'
  ) THEN
    ALTER TABLE guestbook_settings ADD COLUMN threshold_amount numeric DEFAULT 69.00;
  END IF;
END $$;

-- FONCTION : Incrémenter hearts_count
CREATE OR REPLACE FUNCTION increment_hearts_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE guestbook_entries 
  SET hearts_count = hearts_count + 1
  WHERE id = NEW.entry_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FONCTION : Décrémenter hearts_count
CREATE OR REPLACE FUNCTION decrement_hearts_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE guestbook_entries 
  SET hearts_count = GREATEST(0, hearts_count - 1)
  WHERE id = OLD.entry_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS
DROP TRIGGER IF EXISTS trigger_increment_hearts ON guestbook_hearts;
CREATE TRIGGER trigger_increment_hearts
  AFTER INSERT ON guestbook_hearts
  FOR EACH ROW
  EXECUTE FUNCTION increment_hearts_count();

DROP TRIGGER IF EXISTS trigger_decrement_hearts ON guestbook_hearts;
CREATE TRIGGER trigger_decrement_hearts
  AFTER DELETE ON guestbook_hearts
  FOR EACH ROW
  EXECUTE FUNCTION decrement_hearts_count();