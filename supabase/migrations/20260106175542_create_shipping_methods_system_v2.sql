/*
  # Création du système de méthodes de livraison

  1. Nouvelle Table: `shipping_methods`
    - `id` (uuid, primary key) - Identifiant unique
    - `name` (text, not null) - Nom affiché (ex: "Mondial Relay")
    - `code` (text, unique, not null) - Code technique (ex: "mondial_relay")
    - `description` (text) - Description détaillée
    - `cost` (numeric(10,2), not null) - Prix en euros
    - `is_relay` (boolean, default false) - Active le sélecteur de point relais
    - `is_active` (boolean, default true) - Active/désactive la méthode
    - `sort_order` (integer, default 0) - Ordre d'affichage
    - `delivery_time` (text) - Délai de livraison (ex: "24/48h")
    - `type` (text) - Type (free, relay, home)
    - `created_at` (timestamptz) - Date de création
    - `updated_at` (timestamptz) - Date de mise à jour

  2. Données initiales
    - 6 méthodes de livraison configurées

  3. Sécurité
    - RLS activé
    - Lecture publique pour les méthodes actives
    - Modification réservée aux admins
*/

-- Création de la table shipping_methods
CREATE TABLE IF NOT EXISTS shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text DEFAULT '',
  cost numeric(10,2) NOT NULL DEFAULT 0,
  is_relay boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  delivery_time text DEFAULT '',
  type text DEFAULT 'standard',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_shipping_methods_code ON shipping_methods(code);
CREATE INDEX IF NOT EXISTS idx_shipping_methods_active ON shipping_methods(is_active);
CREATE INDEX IF NOT EXISTS idx_shipping_methods_sort ON shipping_methods(sort_order);

-- Activation de RLS
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;

-- Policy : Lecture publique pour les méthodes actives
CREATE POLICY "Anyone can view active shipping methods"
  ON shipping_methods FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Policy : Admins peuvent tout voir, insérer, modifier et supprimer
CREATE POLICY "Admins can manage all shipping methods"
  ON shipping_methods
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Insertion des 6 méthodes par défaut
INSERT INTO shipping_methods (name, code, description, cost, is_relay, is_active, sort_order, delivery_time, type) VALUES
  (
    'Retrait en boutique',
    'retrait_boutique',
    'Retirez votre commande directement en boutique sous 24/48h. Gratuit et sans frais supplémentaires.',
    0.00,
    false,
    true,
    1,
    '24/48h',
    'free'
  ),
  (
    'Chronopost (shop to shop)',
    'chronopost_relay',
    'Livraison en point relais Chronopost sous 24/48h. Le plus rapide des points relais !',
    3.90,
    true,
    true,
    2,
    '24/48h',
    'relay'
  ),
  (
    'Mondial Relay',
    'mondial_relay',
    'Livraison en point relais Mondial Relay sous 3 à 5 jours ouvrés.',
    5.90,
    true,
    true,
    3,
    '3 à 5 jours ouvrés',
    'relay'
  ),
  (
    'GLS Point Relais',
    'gls_relay',
    'Livraison en point relais GLS sous 2 à 3 jours ouvrés.',
    5.90,
    true,
    true,
    4,
    '2 à 3 jours ouvrés',
    'relay'
  ),
  (
    'GLS Domicile',
    'gls_home',
    'Livraison à domicile par GLS sous 2 à 3 jours ouvrés.',
    7.90,
    false,
    true,
    5,
    '2 à 3 jours ouvrés',
    'home'
  ),
  (
    'Colissimo Domicile',
    'colissimo_home',
    'Livraison à domicile par La Poste sous 48h.',
    8.90,
    false,
    true,
    6,
    '48h',
    'home'
  )
ON CONFLICT (code) DO NOTHING;

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_shipping_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_update_shipping_methods_updated_at ON shipping_methods;
CREATE TRIGGER trigger_update_shipping_methods_updated_at
  BEFORE UPDATE ON shipping_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_shipping_methods_updated_at();
