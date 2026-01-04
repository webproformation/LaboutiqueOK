/*
  # Création des tables pour les pages informatives

  ## Nouvelles Tables
  
  ### `contact_messages`
  Table pour stocker les messages de contact envoyés via le formulaire.
  - `id` (uuid, primary key) - Identifiant unique
  - `user_id` (uuid, nullable) - Référence à l'utilisateur (si connecté)
  - `name` (text, not null) - Nom complet
  - `email` (text, not null) - Email du contact
  - `phone` (text, nullable) - Téléphone optionnel
  - `subject` (text, not null) - Sujet du message
  - `message` (text, not null) - Contenu du message
  - `status` (text) - Statut (pending, read, replied)
  - `admin_response` (text, nullable) - Réponse de l'admin
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Date de mise à jour
  
  ### `guestbook_entries`
  Table pour stocker les avis du livre d'or.
  - `id` (uuid, primary key) - Identifiant unique
  - `user_id` (uuid, nullable) - Référence à l'utilisateur
  - `customer_name` (text, not null) - Nom du client
  - `rating` (integer, not null) - Note (1-5)
  - `message` (text, not null) - Avis
  - `photo_url` (text, nullable) - Photo du client/produit
  - `status` (text) - Statut (pending, approved, rejected)
  - `admin_response` (text, nullable) - Réponse de Morgane
  - `votes_count` (integer) - Nombre de votes (cœurs)
  - `ambassador_badge` (boolean) - Badge ambassadrice de la semaine
  - `source` (text) - Source (site, facebook, website)
  - `created_at` (timestamptz) - Date de création
  - `approved_at` (timestamptz, nullable) - Date d'approbation
  - `updated_at` (timestamptz) - Date de mise à jour
  
  ### `guestbook_votes`
  Table pour stocker les votes (cœurs) sur les avis.
  - `id` (uuid, primary key) - Identifiant unique
  - `guestbook_entry_id` (uuid, not null) - Référence à l'avis
  - `user_id` (uuid, not null) - Référence à l'utilisateur qui vote
  - `created_at` (timestamptz) - Date du vote
  - UNIQUE(guestbook_entry_id, user_id) - Un vote par utilisateur par avis
  
  ### `live_streams`
  Table pour gérer les lives et replays.
  - `id` (uuid, primary key) - Identifiant unique
  - `title` (text, not null) - Titre du live
  - `description` (text, nullable) - Description
  - `status` (text) - Statut (scheduled, live, ended)
  - `scheduled_start` (timestamptz, not null) - Date de début prévue
  - `actual_start` (timestamptz, nullable) - Date de début réelle
  - `actual_end` (timestamptz, nullable) - Date de fin réelle
  - `thumbnail_url` (text, nullable) - URL de la miniature
  - `playback_url` (text, nullable) - URL du flux live
  - `replay_url` (text, nullable) - URL du replay
  - `current_viewers` (integer) - Nombre de spectateurs actuels
  - `total_views` (integer) - Nombre total de vues
  - `created_at` (timestamptz) - Date de création
  - `updated_at` (timestamptz) - Date de mise à jour

  ## Sécurité
  - Row Level Security (RLS) activé sur toutes les tables
  - Policies permettant l'insertion publique pour contact_messages
  - Policies authentifiées pour guestbook et votes
  - Policies admin pour la gestion
  
  ## Indexes
  - Index sur les clés étrangères
  - Index sur les statuts pour filtrage rapide
  - Index sur les dates pour tri chronologique
*/

-- =====================================================
-- TABLE: contact_messages
-- =====================================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'replied')),
  admin_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_user ON contact_messages(user_id);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert contact messages"
  ON contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can read own messages"
  ON contact_messages FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- =====================================================
-- TABLE: guestbook_entries
-- =====================================================
CREATE TABLE IF NOT EXISTS guestbook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  message text NOT NULL,
  photo_url text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_response text,
  votes_count integer DEFAULT 0,
  ambassador_badge boolean DEFAULT false,
  source text DEFAULT 'site' CHECK (source IN ('site', 'facebook', 'website')),
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guestbook_status ON guestbook_entries(status);
CREATE INDEX IF NOT EXISTS idx_guestbook_approved ON guestbook_entries(approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_guestbook_votes ON guestbook_entries(votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_guestbook_user ON guestbook_entries(user_id);

ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approved entries"
  ON guestbook_entries FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can insert own entries"
  ON guestbook_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own entries"
  ON guestbook_entries FOR SELECT
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: guestbook_votes
-- =====================================================
CREATE TABLE IF NOT EXISTS guestbook_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guestbook_entry_id uuid NOT NULL REFERENCES guestbook_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(guestbook_entry_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_votes_entry ON guestbook_votes(guestbook_entry_id);
CREATE INDEX IF NOT EXISTS idx_votes_user ON guestbook_votes(user_id);

ALTER TABLE guestbook_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can vote"
  ON guestbook_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read all votes"
  ON guestbook_votes FOR SELECT
  USING (true);

-- =====================================================
-- TABLE: live_streams
-- =====================================================
CREATE TABLE IF NOT EXISTS live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  scheduled_start timestamptz NOT NULL,
  actual_start timestamptz,
  actual_end timestamptz,
  thumbnail_url text,
  playback_url text,
  replay_url text,
  current_viewers integer DEFAULT 0,
  total_views integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_scheduled ON live_streams(scheduled_start DESC);
CREATE INDEX IF NOT EXISTS idx_live_streams_actual ON live_streams(actual_start DESC);

ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read live streams"
  ON live_streams FOR SELECT
  USING (true);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON contact_messages;
CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_guestbook_entries_updated_at ON guestbook_entries;
CREATE TRIGGER update_guestbook_entries_updated_at
  BEFORE UPDATE ON guestbook_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_live_streams_updated_at ON live_streams;
CREATE TRIGGER update_live_streams_updated_at
  BEFORE UPDATE ON live_streams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
