/*
  # Création du système Livre d'Or avec Concours Ambassadrice

  1. Nouvelles Tables
    - `guestbook_entries` : Avis avec photos et concours ambassadrice
    - `guestbook_votes` : Système de votes (cœurs) pour le concours
    - `guestbook_likes` : Table ancienne pour compatibilité
    - `guestbook_settings` : Paramètres du dashboard
  
  2. Sécurité
    - RLS activé sur toutes les tables
    - Entries: Public voit les approuvés, authentifiés peuvent créer
    - Votes: Un vote par utilisateur par avis
    - Settings: Admin uniquement
  
  3. Fonctionnalités
    - Concours ambassadrice avec votes hebdomadaires
    - Récompense 0,20 € pour chaque avis approuvé
    - Support avis Facebook importés
    - Réponse admin personnalisée
    - Badge ambassadrice pour les gagnantes
    - Photo obligatoire pour participer au concours
*/

-- Table des avis du livre d'or
CREATE TABLE guestbook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id text,
  order_number text,
  customer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message text NOT NULL CHECK (char_length(message) <= 500),
  photo_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_response text,
  likes_count integer DEFAULT 0,
  votes_count integer DEFAULT 0,
  reward_amount numeric(10,2) DEFAULT 0.20,
  reward_applied boolean DEFAULT false,
  rgpd_consent boolean NOT NULL DEFAULT false,
  source text DEFAULT 'site' CHECK (source IN ('site', 'facebook', 'website')),
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_guestbook_entries_user_id ON guestbook_entries(user_id);
CREATE INDEX idx_guestbook_entries_order_id ON guestbook_entries(order_id);
CREATE INDEX idx_guestbook_entries_status ON guestbook_entries(status);
CREATE INDEX idx_guestbook_entries_approved_at ON guestbook_entries(approved_at DESC) WHERE status = 'approved';
CREATE INDEX idx_guestbook_entries_votes_count ON guestbook_entries(votes_count DESC) WHERE status = 'approved';
CREATE INDEX idx_guestbook_entries_source ON guestbook_entries(source);

ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view approved entries"
  ON guestbook_entries
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

CREATE POLICY "Authenticated users can create entries"
  ON guestbook_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own entries"
  ON guestbook_entries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin can manage all entries"
  ON guestbook_entries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Table des votes (cœurs)
CREATE TABLE guestbook_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guestbook_entry_id uuid REFERENCES guestbook_entries(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(guestbook_entry_id, user_id)
);

CREATE INDEX idx_guestbook_votes_entry_id ON guestbook_votes(guestbook_entry_id);
CREATE INDEX idx_guestbook_votes_user_id ON guestbook_votes(user_id);

ALTER TABLE guestbook_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view votes"
  ON guestbook_votes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON guestbook_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own votes"
  ON guestbook_votes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Table guestbook_likes (ancienne, pour compatibilité)
CREATE TABLE guestbook_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES guestbook_entries(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entry_id, user_id),
  UNIQUE(entry_id, session_id)
);

CREATE INDEX idx_guestbook_likes_entry_id ON guestbook_likes(entry_id);
CREATE INDEX idx_guestbook_likes_user_id ON guestbook_likes(user_id);
CREATE INDEX idx_guestbook_likes_session_id ON guestbook_likes(session_id);

ALTER TABLE guestbook_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view likes"
  ON guestbook_likes
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can like"
  ON guestbook_likes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Table des paramètres du dashboard
CREATE TABLE guestbook_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diamonds_found integer DEFAULT 0,
  total_reviews integer DEFAULT 0,
  total_packages integer DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE guestbook_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage settings"
  ON guestbook_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

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

-- Trigger pour mettre à jour automatiquement le compteur
DROP TRIGGER IF EXISTS trigger_update_votes_count ON guestbook_votes;
CREATE TRIGGER trigger_update_votes_count
AFTER INSERT OR DELETE ON guestbook_votes
FOR EACH ROW
EXECUTE FUNCTION update_guestbook_votes_count();

-- Fonction pour mettre à jour le compteur de likes (ancienne table)
CREATE OR REPLACE FUNCTION update_guestbook_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE guestbook_entries
    SET likes_count = likes_count + 1
    WHERE id = NEW.entry_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE guestbook_entries
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.entry_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour likes
DROP TRIGGER IF EXISTS trigger_update_likes_count ON guestbook_likes;
CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON guestbook_likes
FOR EACH ROW
EXECUTE FUNCTION update_guestbook_likes_count();