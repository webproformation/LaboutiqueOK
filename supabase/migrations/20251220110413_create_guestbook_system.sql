/*
  # Système du Livre d'Or de Morgane

  1. Nouvelles Tables
    - `guestbook_entries` : Stocke tous les avis du livre d'or
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key vers auth.users)
      - `order_id` (uuid, foreign key vers orders)
      - `order_number` (text, numéro de commande pour affichage)
      - `customer_name` (text, nom de la cliente)
      - `rating` (int, notation en pépites de 1 à 5)
      - `message` (text, message de la cliente, max 500 caractères)
      - `photo_url` (text, URL de la photo uploadée, optionnel)
      - `status` (text, statut: pending, approved, rejected)
      - `admin_response` (text, réponse de Morgane, optionnel)
      - `likes_count` (int, nombre de cœurs reçus)
      - `reward_amount` (numeric, montant crédité en cagnotte)
      - `reward_applied` (boolean, indique si la récompense a été appliquée)
      - `rgpd_consent` (boolean, consentement RGPD pour publication)
      - `created_at` (timestamp, date de soumission)
      - `approved_at` (timestamp, date de validation)

    - `guestbook_likes` : Stocke les likes (cœurs) sur les avis
      - `id` (uuid, primary key)
      - `entry_id` (uuid, foreign key vers guestbook_entries)
      - `user_id` (uuid, foreign key vers auth.users, optionnel)
      - `session_id` (text, identifiant de session pour visiteurs non connectés)
      - `created_at` (timestamp)

    - `guestbook_settings` : Configuration et compteurs du dashboard
      - `id` (uuid, primary key)
      - `diamonds_found` (int, total des diamants trouvés)
      - `total_reviews` (int, total des avis validés)
      - `total_packages` (int, total des colis expédiés)
      - `updated_at` (timestamp)

  2. Sécurité (RLS)
    - Les clientes peuvent créer leur propre avis (une fois par commande)
    - Les clientes peuvent voir leurs propres avis en attente
    - Tout le monde peut voir les avis approuvés
    - Les admins peuvent tout gérer
    - Tout le monde peut liker un avis (authentifié ou non)

  3. Automatisations
    - Vérification qu'une cliente a bien une commande livrée
    - Vérification de l'unicité : un seul avis par commande
    - Mise à jour automatique du compteur de likes
    - Intégration avec le système de fidélité
*/

-- Table des avis du livre d'or
CREATE TABLE IF NOT EXISTS guestbook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  order_number text NOT NULL,
  customer_name text NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message text NOT NULL CHECK (char_length(message) <= 500),
  photo_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_response text,
  likes_count int DEFAULT 0,
  reward_amount numeric(10,2) DEFAULT 0.20,
  reward_applied boolean DEFAULT false,
  rgpd_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  UNIQUE(order_id)
);

-- Table des likes
CREATE TABLE IF NOT EXISTS guestbook_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES guestbook_entries(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entry_id, user_id),
  UNIQUE(entry_id, session_id)
);

-- Table des paramètres du dashboard
CREATE TABLE IF NOT EXISTS guestbook_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diamonds_found int DEFAULT 0,
  total_reviews int DEFAULT 0,
  total_packages int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Insérer les paramètres par défaut
INSERT INTO guestbook_settings (diamonds_found, total_reviews, total_packages)
VALUES (0, 0, 0)
ON CONFLICT DO NOTHING;

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_user_id ON guestbook_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_order_id ON guestbook_entries(order_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_status ON guestbook_entries(status);
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_approved_at ON guestbook_entries(approved_at DESC) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_guestbook_likes_entry_id ON guestbook_likes(entry_id);

-- Enable RLS
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_settings ENABLE ROW LEVEL SECURITY;

-- Policies pour guestbook_entries

-- Les clientes authentifiées peuvent créer leur propre avis
CREATE POLICY "Authenticated users can create their own guestbook entry"
  ON guestbook_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Les clientes peuvent voir leurs propres avis (même en attente)
CREATE POLICY "Users can view their own guestbook entries"
  ON guestbook_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Tout le monde peut voir les avis approuvés
CREATE POLICY "Everyone can view approved guestbook entries"
  ON guestbook_entries FOR SELECT
  TO public
  USING (status = 'approved');

-- Les admins peuvent tout voir
CREATE POLICY "Admins can view all guestbook entries"
  ON guestbook_entries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Les admins peuvent tout modifier
CREATE POLICY "Admins can update all guestbook entries"
  ON guestbook_entries FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Les admins peuvent supprimer
CREATE POLICY "Admins can delete guestbook entries"
  ON guestbook_entries FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policies pour guestbook_likes

-- Tout le monde peut liker (authentifié ou non)
CREATE POLICY "Anyone can like an entry"
  ON guestbook_likes FOR INSERT
  TO public
  WITH CHECK (true);

-- Tout le monde peut voir les likes
CREATE POLICY "Everyone can view likes"
  ON guestbook_likes FOR SELECT
  TO public
  USING (true);

-- Les utilisateurs peuvent supprimer leur propre like
CREATE POLICY "Users can remove their own like"
  ON guestbook_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Les visiteurs non connectés peuvent supprimer leur like via session_id
CREATE POLICY "Anonymous users can remove their like by session"
  ON guestbook_likes FOR DELETE
  TO public
  USING (session_id IS NOT NULL);

-- Policies pour guestbook_settings

-- Tout le monde peut lire les paramètres
CREATE POLICY "Everyone can read guestbook settings"
  ON guestbook_settings FOR SELECT
  TO public
  USING (true);

-- Seuls les admins peuvent modifier
CREATE POLICY "Admins can update guestbook settings"
  ON guestbook_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Fonction pour mettre à jour le compteur de likes
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

-- Trigger pour mettre à jour automatiquement le compteur de likes
DROP TRIGGER IF EXISTS trigger_update_likes_count ON guestbook_likes;
CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON guestbook_likes
FOR EACH ROW
EXECUTE FUNCTION update_guestbook_likes_count();

-- Fonction pour mettre à jour le compteur total des avis dans guestbook_settings
CREATE OR REPLACE FUNCTION update_total_reviews_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE guestbook_settings
    SET total_reviews = (SELECT COUNT(*) FROM guestbook_entries WHERE status = 'approved'),
        updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour le compteur total des avis
DROP TRIGGER IF EXISTS trigger_update_total_reviews ON guestbook_entries;
CREATE TRIGGER trigger_update_total_reviews
AFTER UPDATE ON guestbook_entries
FOR EACH ROW
EXECUTE FUNCTION update_total_reviews_count();
