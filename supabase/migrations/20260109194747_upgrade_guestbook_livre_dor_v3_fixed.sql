/*
  # Upgrade Livre d'Or (Système Complet avec Pépites) - Version Fixed
  
  1. Mise à jour table guestbook_entries
    - rating_pepites : Notation en pépites (1-5) au lieu d'étoiles
    - order_id : Référence à la commande
    - order_number : Numéro de commande
    - is_verified_purchase : Badge "Achat Vérifié"
    - photo_url : URL de la photo du client
    - admin_response : Réponse de Morgane
    - admin_responded_at : Date de réponse
    - likes_count : Nombre de ❤️ reçus
    - wallet_credited : Montant crédité (0.20€ ou 0.50€)
    - credited_at : Date du crédit
    - gdpr_consent : Consentement RGPD
    - moderation_status : pending, approved, rejected
    - moderation_notes : Notes admin
    - moderated_at : Date de modération
    - moderated_by : Admin ayant modéré
    
  2. Table guestbook_likes
    - Tracking des likes par utilisateur
    
  3. Sécurité RLS
    - Lecture publique des avis approuvés
    - Création authentifiée avec commande vérifiée
    - Gestion admin complète
*/

-- 1. Vérifier et créer/mettre à jour la table guestbook_entries
DO $$
BEGIN
  -- Créer la table si elle n'existe pas
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guestbook_entries') THEN
    CREATE TABLE guestbook_entries (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
      order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
      order_number text,
      name text NOT NULL,
      rating_pepites integer NOT NULL CHECK (rating_pepites >= 1 AND rating_pepites <= 5),
      message text NOT NULL CHECK (char_length(message) <= 500),
      photo_url text,
      is_verified_purchase boolean DEFAULT false,
      admin_response text,
      admin_responded_at timestamptz,
      likes_count integer DEFAULT 0,
      wallet_credited numeric(10,2) DEFAULT 0.00,
      credited_at timestamptz,
      gdpr_consent boolean DEFAULT false NOT NULL,
      moderation_status text DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
      moderation_notes text,
      moderated_at timestamptz,
      moderated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    RAISE NOTICE 'Table guestbook_entries créée';
  END IF;
END $$;

-- Ajouter les colonnes manquantes si nécessaire
DO $$
BEGIN
  -- rating_pepites
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guestbook_entries' AND column_name = 'rating_pepites') THEN
    ALTER TABLE guestbook_entries ADD COLUMN rating_pepites integer;
    UPDATE guestbook_entries SET rating_pepites = COALESCE(rating, 5) WHERE rating_pepites IS NULL;
    ALTER TABLE guestbook_entries ALTER COLUMN rating_pepites SET NOT NULL;
    ALTER TABLE guestbook_entries ADD CONSTRAINT check_rating_pepites CHECK (rating_pepites >= 1 AND rating_pepites <= 5);
  END IF;

  -- order_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guestbook_entries' AND column_name = 'order_id') THEN
    ALTER TABLE guestbook_entries ADD COLUMN order_id uuid REFERENCES orders(id) ON DELETE SET NULL;
  END IF;

  -- order_number
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guestbook_entries' AND column_name = 'order_number') THEN
    ALTER TABLE guestbook_entries ADD COLUMN order_number text;
  END IF;

  -- is_verified_purchase
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guestbook_entries' AND column_name = 'is_verified_purchase') THEN
    ALTER TABLE guestbook_entries ADD COLUMN is_verified_purchase boolean DEFAULT false;
  END IF;

  -- photo_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guestbook_entries' AND column_name = 'photo_url') THEN
    ALTER TABLE guestbook_entries ADD COLUMN photo_url text;
  END IF;

  -- admin_response
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guestbook_entries' AND column_name = 'admin_response') THEN
    ALTER TABLE guestbook_entries ADD COLUMN admin_response text;
  END IF;

  -- admin_responded_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guestbook_entries' AND column_name = 'admin_responded_at') THEN
    ALTER TABLE guestbook_entries ADD COLUMN admin_responded_at timestamptz;
  END IF;

  -- likes_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guestbook_entries' AND column_name = 'likes_count') THEN
    ALTER TABLE guestbook_entries ADD COLUMN likes_count integer DEFAULT 0;
  END IF;

  -- wallet_credited
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guestbook_entries' AND column_name = 'wallet_credited') THEN
    ALTER TABLE guestbook_entries ADD COLUMN wallet_credited numeric(10,2) DEFAULT 0.00;
  END IF;

  -- credited_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guestbook_entries' AND column_name = 'credited_at') THEN
    ALTER TABLE guestbook_entries ADD COLUMN credited_at timestamptz;
  END IF;

  -- gdpr_consent
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guestbook_entries' AND column_name = 'gdpr_consent') THEN
    ALTER TABLE guestbook_entries ADD COLUMN gdpr_consent boolean DEFAULT false NOT NULL;
  END IF;

  -- moderation_status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guestbook_entries' AND column_name = 'moderation_status') THEN
    ALTER TABLE guestbook_entries ADD COLUMN moderation_status text DEFAULT 'pending';
    ALTER TABLE guestbook_entries ADD CONSTRAINT check_moderation_status CHECK (moderation_status IN ('pending', 'approved', 'rejected'));
  END IF;

  -- moderation_notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guestbook_entries' AND column_name = 'moderation_notes') THEN
    ALTER TABLE guestbook_entries ADD COLUMN moderation_notes text;
  END IF;

  -- moderated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guestbook_entries' AND column_name = 'moderated_at') THEN
    ALTER TABLE guestbook_entries ADD COLUMN moderated_at timestamptz;
  END IF;

  -- moderated_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guestbook_entries' AND column_name = 'moderated_by') THEN
    ALTER TABLE guestbook_entries ADD COLUMN moderated_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 2. Table guestbook_likes
CREATE TABLE IF NOT EXISTS guestbook_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES guestbook_entries(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entry_id, user_id),
  UNIQUE(entry_id, ip_address)
);

-- 3. Index pour performance
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_user ON guestbook_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_order ON guestbook_entries(order_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_moderation ON guestbook_entries(moderation_status);
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_likes ON guestbook_entries(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_guestbook_likes_entry ON guestbook_likes(entry_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_likes_user ON guestbook_likes(user_id);

-- 4. RLS
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_likes ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies guestbook_entries
DROP POLICY IF EXISTS "Public can view approved entries" ON guestbook_entries;
DROP POLICY IF EXISTS "Anyone can view approved guestbook entries" ON guestbook_entries;
DROP POLICY IF EXISTS "Users can view own guestbook entries" ON guestbook_entries;
DROP POLICY IF EXISTS "Users can view own entries" ON guestbook_entries;
DROP POLICY IF EXISTS "Users can create guestbook entries" ON guestbook_entries;
DROP POLICY IF EXISTS "Users can create entries" ON guestbook_entries;
DROP POLICY IF EXISTS "Admins can manage guestbook" ON guestbook_entries;
DROP POLICY IF EXISTS "Admins can manage all entries" ON guestbook_entries;

-- Supprimer les anciennes policies guestbook_likes
DROP POLICY IF EXISTS "Anyone can view likes" ON guestbook_likes;
DROP POLICY IF EXISTS "Authenticated users can like" ON guestbook_likes;
DROP POLICY IF EXISTS "Users can remove their own likes" ON guestbook_likes;

-- Nouvelles policies guestbook_entries
CREATE POLICY "Public can view approved entries"
  ON guestbook_entries FOR SELECT
  TO anon, authenticated
  USING (moderation_status = 'approved');

CREATE POLICY "Users can view own entries"
  ON guestbook_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create entries"
  ON guestbook_entries FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND gdpr_consent = true
  );

CREATE POLICY "Admins can manage all entries"
  ON guestbook_entries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Nouvelles policies guestbook_likes
CREATE POLICY "Anyone can view likes"
  ON guestbook_likes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can like"
  ON guestbook_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes"
  ON guestbook_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Fonction pour incrémenter/décrémenter les likes
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
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.entry_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS trigger_update_guestbook_likes ON guestbook_likes;
CREATE TRIGGER trigger_update_guestbook_likes
  AFTER INSERT OR DELETE ON guestbook_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_guestbook_likes_count();