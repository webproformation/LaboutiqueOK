/*
  # Système de livre d'or et avis clients

  1. Nouvelle table
    - `customer_reviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users) - Utilisateur authentifié (optionnel)
      - `customer_name` (text) - Nom du client si non authentifié
      - `customer_email` (text) - Email du client si non authentifié
      - `rating` (integer) - Note de 1 à 5 étoiles
      - `comment` (text) - Commentaire du client
      - `source` (text) - Source de l'avis: 'website', 'facebook', 'product', 'order'
      - `source_id` (text) - ID de la source (product_id, order_id, facebook_post_id, etc.)
      - `is_approved` (boolean) - Avis approuvé par un admin
      - `is_featured` (boolean) - Avis mis en avant
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur `customer_reviews` table
    - Policy pour permettre aux utilisateurs authentifiés de créer des avis
    - Policy pour permettre aux utilisateurs anonymes de créer des avis (avec modération)
    - Policy pour permettre à tous de lire les avis approuvés
    - Policy pour les admins de tout gérer

  3. Index
    - Index sur `user_id` pour les requêtes par utilisateur
    - Index sur `is_approved` pour les requêtes d'avis approuvés
    - Index sur `is_featured` pour les avis mis en avant
    - Index sur `source` et `source_id` pour les avis par source
    - Index sur `created_at` pour trier par date

  4. Important
    - Les avis non approuvés ne sont pas visibles publiquement
    - Seuls les admins peuvent approuver ou rejeter les avis
    - Les avis peuvent être associés à des produits, commandes ou être généraux
*/

-- Créer la table customer_reviews
CREATE TABLE IF NOT EXISTS customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_email text,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  source text NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'facebook', 'product', 'order')),
  source_id text,
  is_approved boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_customer_reviews_user_id ON customer_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_is_approved ON customer_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_is_featured ON customer_reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_source ON customer_reviews(source);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_source_id ON customer_reviews(source_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_created_at ON customer_reviews(created_at DESC);

-- Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_customer_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_reviews_updated_at
  BEFORE UPDATE ON customer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_reviews_updated_at();

-- Activer RLS
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire les avis approuvés
CREATE POLICY "Anyone can view approved reviews"
  ON customer_reviews
  FOR SELECT
  USING (is_approved = true);

-- Policy: Les utilisateurs authentifiés peuvent créer des avis
CREATE POLICY "Authenticated users can create reviews"
  ON customer_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs anonymes peuvent créer des avis (non approuvés par défaut)
CREATE POLICY "Anonymous users can create reviews"
  ON customer_reviews
  FOR INSERT
  TO anon
  WITH CHECK (is_approved = false);

-- Policy: Les utilisateurs peuvent voir leurs propres avis (même non approuvés)
CREATE POLICY "Users can view own reviews"
  ON customer_reviews
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Les admins peuvent tout voir
CREATE POLICY "Admins can view all reviews"
  ON customer_reviews
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policy: Les admins peuvent mettre à jour tous les avis
CREATE POLICY "Admins can update all reviews"
  ON customer_reviews
  FOR UPDATE
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

-- Policy: Les admins peuvent supprimer tous les avis
CREATE POLICY "Admins can delete all reviews"
  ON customer_reviews
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Insérer quelques avis par défaut (ceux du slider)
INSERT INTO customer_reviews (customer_name, rating, comment, source, is_approved, is_featured, created_at) VALUES
  ('Sophie M.', 5, 'Excellente expérience ! Les produits sont de qualité et la livraison rapide. Je recommande vivement La Boutique de Morgane pour son service client impeccable.', 'website', true, true, '2025-12-01'),
  ('Marie L.', 5, 'Ravie de ma commande ! Les articles correspondent parfaitement aux photos. Morgane a un vrai talent pour sélectionner des pièces tendance et de qualité.', 'website', true, true, '2025-11-28'),
  ('Claire D.', 5, 'Super boutique ! J''adore les lives shopping, c''est convivial et on découvre de belles choses. Les prix sont justes et la qualité au rendez-vous.', 'website', true, true, '2025-11-25'),
  ('Julie P.', 5, 'Toujours satisfaite de mes achats ! L''emballage est soigné et les produits arrivent en parfait état. Morgane est très réactive et à l''écoute.', 'website', true, true, '2025-11-20'),
  ('Émilie R.', 5, 'Une vraie pépite cette boutique ! Les produits sont uniques et le service irréprochable. J''apprécie particulièrement les conseils personnalisés de Morgane.', 'website', true, true, '2025-11-15'),
  ('Isabelle B.', 5, 'Excellente découverte ! La sélection est variée et de qualité. Les lives sont un moment convivial où on se sent comme entre amies. Bravo Morgane !', 'website', true, true, '2025-11-10')
ON CONFLICT DO NOTHING;
