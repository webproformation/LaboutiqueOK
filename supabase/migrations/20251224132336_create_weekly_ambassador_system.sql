/*
  # Système Ambassadrice de la Semaine

  1. Nouvelles Tables
    - `guestbook_votes`
      - `id` (uuid, primary key)
      - `guestbook_entry_id` (uuid, foreign key vers guestbook_entries)
      - `user_id` (uuid, foreign key vers profiles)
      - `created_at` (timestamp)
      - Contrainte unique : un seul vote par utilisateur et par avis

    - `weekly_ambassadors`
      - `id` (uuid, primary key)
      - `guestbook_entry_id` (uuid, foreign key vers guestbook_entries)
      - `user_id` (uuid, foreign key vers profiles)
      - `week_start_date` (date)
      - `week_end_date` (date)
      - `total_votes` (integer)
      - `reward_amount` (decimal)
      - `is_active` (boolean) - Pour afficher sur la home page
      - `created_at` (timestamp)

  2. Modifications
    - Ajouter `ambassador_badge` à `profiles` (badge couronne dorée)
    - Ajouter `votes_count` à `guestbook_entries` pour optimisation

  3. Sécurité
    - RLS activé sur toutes les tables
    - Politique pour les votes : utilisateurs connectés uniquement
    - Politique admin pour l'élection
*/

-- Ajouter le badge ambassadrice et compteur de votes
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS ambassador_badge BOOLEAN DEFAULT false;

ALTER TABLE guestbook_entries
ADD COLUMN IF NOT EXISTS votes_count INTEGER DEFAULT 0;

-- Table des votes sur les avis du livre d'or
CREATE TABLE IF NOT EXISTS guestbook_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guestbook_entry_id UUID NOT NULL REFERENCES guestbook_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_vote_per_user_per_entry UNIQUE (guestbook_entry_id, user_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_guestbook_votes_entry_id ON guestbook_votes(guestbook_entry_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_votes_user_id ON guestbook_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_votes_created_at ON guestbook_votes(created_at);

-- Table des ambassadrices de la semaine
CREATE TABLE IF NOT EXISTS weekly_ambassadors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guestbook_entry_id UUID NOT NULL REFERENCES guestbook_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  total_votes INTEGER NOT NULL DEFAULT 0,
  reward_amount DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_weekly_ambassadors_user_id ON weekly_ambassadors(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_ambassadors_is_active ON weekly_ambassadors(is_active);
CREATE INDEX IF NOT EXISTS idx_weekly_ambassadors_week_dates ON weekly_ambassadors(week_start_date, week_end_date);

-- Enable RLS
ALTER TABLE guestbook_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_ambassadors ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour guestbook_votes

-- Tout le monde peut lire les votes (pour afficher le compteur)
CREATE POLICY "Tous peuvent lire les votes"
  ON guestbook_votes FOR SELECT
  TO authenticated, anon
  USING (true);

-- Seuls les utilisateurs connectés peuvent voter
CREATE POLICY "Utilisateurs connectés peuvent voter"
  ON guestbook_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leur propre vote
CREATE POLICY "Utilisateurs peuvent supprimer leur vote"
  ON guestbook_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Politiques RLS pour weekly_ambassadors

-- Tout le monde peut lire les ambassadrices actives
CREATE POLICY "Tous peuvent lire les ambassadrices"
  ON weekly_ambassadors FOR SELECT
  TO authenticated, anon
  USING (true);

-- Seuls les admins peuvent créer des ambassadrices
CREATE POLICY "Admins peuvent créer des ambassadrices"
  ON weekly_ambassadors FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Seuls les admins peuvent modifier les ambassadrices
CREATE POLICY "Admins peuvent modifier les ambassadrices"
  ON weekly_ambassadors FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Fonction pour mettre à jour le compteur de votes
CREATE OR REPLACE FUNCTION update_guestbook_votes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE guestbook_entries
    SET votes_count = votes_count + 1
    WHERE id = NEW.guestbook_entry_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE guestbook_entries
    SET votes_count = GREATEST(0, votes_count - 1)
    WHERE id = OLD.guestbook_entry_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour automatiquement le compteur de votes
DROP TRIGGER IF EXISTS trigger_update_votes_count ON guestbook_votes;
CREATE TRIGGER trigger_update_votes_count
  AFTER INSERT OR DELETE ON guestbook_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_guestbook_votes_count();

-- Fonction pour élire une ambassadrice (appelée par l'admin)
CREATE OR REPLACE FUNCTION elect_weekly_ambassador(
  p_guestbook_entry_id UUID,
  p_week_start_date DATE,
  p_week_end_date DATE
)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_total_votes INTEGER;
  v_reward_amount DECIMAL(10, 2) := 5.00;
  v_result JSON;
BEGIN
  -- Récupérer l'user_id de l'avis
  SELECT user_id INTO v_user_id
  FROM guestbook_entries
  WHERE id = p_guestbook_entry_id;

  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Avis introuvable');
  END IF;

  -- Compter les votes sur la période
  SELECT COUNT(*) INTO v_total_votes
  FROM guestbook_votes
  WHERE guestbook_entry_id = p_guestbook_entry_id
  AND created_at >= p_week_start_date
  AND created_at < p_week_end_date + INTERVAL '1 day';

  -- Désactiver les anciennes ambassadrices
  UPDATE weekly_ambassadors
  SET is_active = false
  WHERE is_active = true;

  -- Créer la nouvelle ambassadrice
  INSERT INTO weekly_ambassadors (
    guestbook_entry_id,
    user_id,
    week_start_date,
    week_end_date,
    total_votes,
    reward_amount,
    is_active
  ) VALUES (
    p_guestbook_entry_id,
    v_user_id,
    p_week_start_date,
    p_week_end_date,
    v_total_votes,
    v_reward_amount,
    true
  );

  -- Attribuer le badge couronne dorée
  UPDATE profiles
  SET ambassador_badge = true
  WHERE id = v_user_id;

  -- Créditer la cagnotte (SANS multiplicateur)
  UPDATE profiles
  SET wallet_balance = wallet_balance + v_reward_amount
  WHERE id = v_user_id;

  -- Enregistrer dans l'historique de la cagnotte
  INSERT INTO loyalty_transactions (
    user_id,
    transaction_type,
    amount,
    description
  ) VALUES (
    v_user_id,
    'earn',
    v_reward_amount,
    'Élue Ambassadrice de la Semaine 👑'
  );

  v_result := json_build_object(
    'success', true,
    'user_id', v_user_id,
    'total_votes', v_total_votes,
    'reward_amount', v_reward_amount
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
