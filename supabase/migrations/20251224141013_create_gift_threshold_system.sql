/*
  # Système de Barre de Progression Cadeau Surprise

  1. Nouvelles Tables
    - `gift_thresholds`
      - `id` (uuid, primary key)
      - `threshold_amount` (decimal) - Montant du palier (ex: 69.00€)
      - `gift_name` (text) - Nom du cadeau
      - `gift_description` (text) - Description du cadeau
      - `is_active` (boolean) - Actif/Inactif
      - `display_message_before` (text) - Message avant le palier
      - `display_message_after` (text) - Message après le palier
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `order_gift_tracking`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key vers orders) - NULLABLE car on track aussi les paniers
      - `user_id` (uuid, foreign key vers profiles)
      - `cart_session_id` (text) - Pour les utilisateurs non connectés
      - `delivery_batch_id` (uuid, nullable) - Lié au colis ouvert
      - `cumulative_amount` (decimal) - Montant cumulé
      - `gift_threshold_id` (uuid, foreign key vers gift_thresholds)
      - `gift_unlocked` (boolean) - Cadeau débloqué
      - `gift_included_in_order` (boolean) - Cadeau inclus dans une commande
      - `gift_included_at` (timestamp) - Date d'inclusion du cadeau
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Colonnes ajoutées à orders
    - `gift_included` (boolean) - Cadeau surprise inclus
    - `gift_description` (text) - Description du cadeau inclus

  3. Sécurité
    - RLS activé sur toutes les tables
    - Les utilisateurs peuvent voir leurs propres données
    - Les admins peuvent tout gérer
*/

-- Table des paliers de cadeaux
CREATE TABLE IF NOT EXISTS gift_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold_amount DECIMAL(10,2) NOT NULL DEFAULT 69.00,
  gift_name TEXT NOT NULL,
  gift_description TEXT,
  is_active BOOLEAN DEFAULT true,
  display_message_before TEXT DEFAULT 'Plus que {amount}€ pour recevoir un cadeau surprise ! 🎁',
  display_message_after TEXT DEFAULT 'Félicitations ! Votre cadeau surprise est débloqué ! ✨',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_gift_thresholds_active ON gift_thresholds(is_active);

-- Table de tracking des cadeaux par utilisateur/commande
CREATE TABLE IF NOT EXISTS order_gift_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cart_session_id TEXT,
  delivery_batch_id UUID REFERENCES delivery_batches(id) ON DELETE SET NULL,
  cumulative_amount DECIMAL(10,2) DEFAULT 0,
  gift_threshold_id UUID REFERENCES gift_thresholds(id) ON DELETE SET NULL,
  gift_unlocked BOOLEAN DEFAULT false,
  gift_included_in_order BOOLEAN DEFAULT false,
  gift_included_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_order_gift_tracking_user ON order_gift_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_order_gift_tracking_batch ON order_gift_tracking(delivery_batch_id);
CREATE INDEX IF NOT EXISTS idx_order_gift_tracking_order ON order_gift_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_order_gift_tracking_session ON order_gift_tracking(cart_session_id);

-- Ajouter les colonnes aux commandes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'gift_included'
  ) THEN
    ALTER TABLE orders ADD COLUMN gift_included BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'gift_description'
  ) THEN
    ALTER TABLE orders ADD COLUMN gift_description TEXT;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE gift_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_gift_tracking ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour gift_thresholds

-- Tout le monde peut lire les paliers actifs
CREATE POLICY "Tous peuvent lire les paliers actifs"
  ON gift_thresholds FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Admins peuvent tout lire
CREATE POLICY "Admins peuvent lire tous les paliers"
  ON gift_thresholds FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins peuvent créer des paliers
CREATE POLICY "Admins peuvent créer des paliers"
  ON gift_thresholds FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

-- Admins peuvent modifier les paliers
CREATE POLICY "Admins peuvent modifier les paliers"
  ON gift_thresholds FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins peuvent supprimer les paliers
CREATE POLICY "Admins peuvent supprimer les paliers"
  ON gift_thresholds FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Politiques RLS pour order_gift_tracking

-- Les utilisateurs peuvent créer leur propre tracking
CREATE POLICY "Utilisateurs peuvent créer leur tracking"
  ON order_gift_tracking FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    auth.uid() = user_id OR
    auth.uid() IS NULL
  );

-- Les utilisateurs peuvent lire leur propre tracking
CREATE POLICY "Utilisateurs peuvent lire leur tracking"
  ON order_gift_tracking FOR SELECT
  TO authenticated, anon
  USING (
    auth.uid() = user_id OR
    auth.uid() IS NULL
  );

-- Les utilisateurs peuvent mettre à jour leur tracking
CREATE POLICY "Utilisateurs peuvent mettre à jour leur tracking"
  ON order_gift_tracking FOR UPDATE
  TO authenticated, anon
  USING (
    auth.uid() = user_id OR
    auth.uid() IS NULL
  );

-- Admins peuvent tout lire
CREATE POLICY "Admins peuvent lire tous les trackings"
  ON order_gift_tracking FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

-- Admins peuvent tout modifier
CREATE POLICY "Admins peuvent modifier tous les trackings"
  ON order_gift_tracking FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Fonction pour mettre à jour le updated_at
CREATE OR REPLACE FUNCTION update_gift_thresholds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_order_gift_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER gift_thresholds_updated_at_trigger
  BEFORE UPDATE ON gift_thresholds
  FOR EACH ROW
  EXECUTE FUNCTION update_gift_thresholds_updated_at();

CREATE TRIGGER order_gift_tracking_updated_at_trigger
  BEFORE UPDATE ON order_gift_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_order_gift_tracking_updated_at();

-- Fonction pour calculer le montant cumulatif d'un utilisateur
CREATE OR REPLACE FUNCTION calculate_cumulative_gift_amount(
  p_user_id UUID,
  p_delivery_batch_id UUID DEFAULT NULL,
  p_cart_amount DECIMAL DEFAULT 0
)
RETURNS DECIMAL AS $$
DECLARE
  v_total_orders DECIMAL := 0;
  v_total DECIMAL := 0;
BEGIN
  -- Si le colis est ouvert, calculer la somme des commandes rattachées
  IF p_delivery_batch_id IS NOT NULL THEN
    SELECT COALESCE(SUM(total), 0) INTO v_total_orders
    FROM orders
    WHERE user_id = p_user_id
    AND delivery_batch_id = p_delivery_batch_id
    AND status NOT IN ('cancelled', 'failed', 'refunded');
  END IF;

  -- Ajouter le montant du panier actuel
  v_total := v_total_orders + p_cart_amount;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un cadeau doit être débloqué
CREATE OR REPLACE FUNCTION check_gift_unlock(
  p_user_id UUID,
  p_cumulative_amount DECIMAL
)
RETURNS JSON AS $$
DECLARE
  v_threshold RECORD;
  v_result JSON;
BEGIN
  -- Récupérer le palier actif
  SELECT * INTO v_threshold
  FROM gift_thresholds
  WHERE is_active = true
  ORDER BY threshold_amount ASC
  LIMIT 1;

  IF v_threshold IS NULL THEN
    RETURN json_build_object(
      'gift_unlocked', false,
      'threshold_amount', 0,
      'remaining_amount', 0,
      'message', ''
    );
  END IF;

  IF p_cumulative_amount >= v_threshold.threshold_amount THEN
    v_result := json_build_object(
      'gift_unlocked', true,
      'threshold_amount', v_threshold.threshold_amount,
      'remaining_amount', 0,
      'message', v_threshold.display_message_after,
      'gift_name', v_threshold.gift_name,
      'gift_description', v_threshold.gift_description,
      'gift_threshold_id', v_threshold.id
    );
  ELSE
    v_result := json_build_object(
      'gift_unlocked', false,
      'threshold_amount', v_threshold.threshold_amount,
      'remaining_amount', v_threshold.threshold_amount - p_cumulative_amount,
      'message', REPLACE(v_threshold.display_message_before, '{amount}', 
                        (v_threshold.threshold_amount - p_cumulative_amount)::TEXT),
      'gift_name', v_threshold.gift_name,
      'gift_description', v_threshold.gift_description,
      'gift_threshold_id', v_threshold.id
    );
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insérer un palier par défaut
INSERT INTO gift_thresholds (
  threshold_amount,
  gift_name,
  gift_description,
  is_active,
  display_message_before,
  display_message_after
) VALUES (
  69.00,
  'Cadeau Surprise',
  'Un cadeau surprise sera inclus dans votre colis',
  true,
  'Plus que {amount}€ pour recevoir un cadeau surprise ! 🎁',
  'Félicitations ! Votre cadeau surprise est débloqué ! ✨'
) ON CONFLICT DO NOTHING;
