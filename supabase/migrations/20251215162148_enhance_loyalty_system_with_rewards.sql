/*
  # Amélioration du système de fidélité avec récompenses

  1. Nouvelles tables
    - `loyalty_rewards` : Types de récompenses disponibles
      - `id` (uuid, primary key)
      - `name` (text, nom de la récompense)
      - `description` (text, description)
      - `type` (text, type: free_delivery, free_product, discount)
      - `value` (numeric, valeur de la récompense)
      - `points_required` (integer, points requis)
      - `validity_days` (integer, validité en jours)
      - `is_active` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `loyalty_rewards_unlocked` : Récompenses débloquées par les utilisateurs
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key vers auth.users)
      - `reward_id` (uuid, foreign key vers loyalty_rewards)
      - `status` (text, statut: pending_choice, selected, used, expired)
      - `selected_reward_type` (text, type de récompense sélectionnée)
      - `coupon_id` (uuid, foreign key vers user_coupons)
      - `unlocked_at` (timestamptz)
      - `selected_at` (timestamptz)
      - `used_at` (timestamptz)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

    - `loyalty_live_shares` : Suivi des partages de live
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key vers auth.users)
      - `live_stream_id` (uuid, foreign key vers live_streams)
      - `platform` (text, plateforme de partage)
      - `points_awarded` (integer, points attribués)
      - `shared_at` (timestamptz)

  2. Modifications de loyalty_points
    - Ajouter colonne pour les points de commandes (1€ = 1 pt)
    - Ajouter colonne pour les points de partage de live
    - Ajouter colonne pour le total des points

  3. Récompenses par défaut
    - Livraison Offerte (200 points)
    - Produit Maison gratuit (200 points)
    - Frais de port offerts (200 points)

  4. Sécurité
    - Enable RLS sur toutes les tables
    - Policies adaptées
*/

-- Alter loyalty_points table to add new columns
ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS order_points integer DEFAULT 0;
ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS live_share_points integer DEFAULT 0;
ALTER TABLE loyalty_points ADD COLUMN IF NOT EXISTS total_points integer DEFAULT 0;

-- Create loyalty_rewards table
CREATE TABLE IF NOT EXISTS loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('free_delivery', 'free_product', 'discount')),
  value numeric DEFAULT 0,
  points_required integer DEFAULT 200,
  validity_days integer DEFAULT 15,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create loyalty_rewards_unlocked table
CREATE TABLE IF NOT EXISTS loyalty_rewards_unlocked (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reward_id uuid REFERENCES loyalty_rewards(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending_choice' CHECK (status IN ('pending_choice', 'selected', 'used', 'expired')),
  selected_reward_type text,
  coupon_id uuid REFERENCES user_coupons(id) ON DELETE SET NULL,
  unlocked_at timestamptz DEFAULT now(),
  selected_at timestamptz,
  used_at timestamptz,
  expires_at timestamptz DEFAULT (now() + INTERVAL '15 days'),
  created_at timestamptz DEFAULT now()
);

-- Create loyalty_live_shares table
CREATE TABLE IF NOT EXISTS loyalty_live_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  live_stream_id uuid REFERENCES live_streams(id) ON DELETE CASCADE NOT NULL,
  platform text NOT NULL,
  points_awarded integer DEFAULT 3,
  shared_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards_unlocked ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_live_shares ENABLE ROW LEVEL SECURITY;

-- Policies for loyalty_rewards
CREATE POLICY "Anyone can view active rewards"
  ON loyalty_rewards
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage rewards"
  ON loyalty_rewards
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policies for loyalty_rewards_unlocked
CREATE POLICY "Users can view own unlocked rewards"
  ON loyalty_rewards_unlocked
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own pending rewards"
  ON loyalty_rewards_unlocked
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending_choice')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert unlocked rewards"
  ON loyalty_rewards_unlocked
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all unlocked rewards"
  ON loyalty_rewards_unlocked
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Policies for loyalty_live_shares
CREATE POLICY "Users can view own live shares"
  ON loyalty_live_shares
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own live shares"
  ON loyalty_live_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all live shares"
  ON loyalty_live_shares
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_unlocked_user_id ON loyalty_rewards_unlocked(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_rewards_unlocked_status ON loyalty_rewards_unlocked(status);
CREATE INDEX IF NOT EXISTS idx_loyalty_live_shares_user_id ON loyalty_live_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_live_shares_live_stream_id ON loyalty_live_shares(live_stream_id);

-- Insert default rewards
INSERT INTO loyalty_rewards (name, description, type, value, points_required, validity_days)
VALUES 
  ('Livraison Offerte', 'Profitez de la livraison gratuite sur votre prochaine commande', 'free_delivery', 0, 200, 15),
  ('Produit Maison Gratuit', 'Recevez un produit maison offert avec votre commande', 'free_product', 0, 200, 15),
  ('Frais de Port Offerts', 'Vos frais de port sont offerts sur la prochaine commande', 'free_delivery', 0, 200, 15)
ON CONFLICT DO NOTHING;

-- Function to calculate total loyalty points
CREATE OR REPLACE FUNCTION calculate_total_loyalty_points(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_total integer;
BEGIN
  SELECT 
    COALESCE(page_visit_points, 0) + 
    COALESCE(live_participation_count, 0) + 
    COALESCE(order_points, 0) + 
    COALESCE(live_share_points, 0)
  INTO v_total
  FROM loyalty_points
  WHERE user_id = p_user_id;

  RETURN COALESCE(v_total, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to add live share points (max 3 points per live)
CREATE OR REPLACE FUNCTION add_live_share_points(
  p_user_id uuid,
  p_live_stream_id uuid,
  p_platform text
)
RETURNS jsonb AS $$
DECLARE
  v_share_count integer;
  v_points_to_award integer;
  v_current_share_points integer;
  v_new_total integer;
BEGIN
  -- Check how many shares already for this live
  SELECT COUNT(*) INTO v_share_count
  FROM loyalty_live_shares
  WHERE user_id = p_user_id
  AND live_stream_id = p_live_stream_id;

  -- Max 1 share = 3 points per live
  IF v_share_count >= 1 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Vous avez déjà partagé ce live'
    );
  END IF;

  v_points_to_award := 3;

  -- Insert share record
  INSERT INTO loyalty_live_shares (
    user_id,
    live_stream_id,
    platform,
    points_awarded
  )
  VALUES (
    p_user_id,
    p_live_stream_id,
    p_platform,
    v_points_to_award
  );

  -- Update loyalty points
  INSERT INTO loyalty_points (user_id, live_share_points, total_points)
  VALUES (p_user_id, v_points_to_award, v_points_to_award)
  ON CONFLICT (user_id)
  DO UPDATE SET
    live_share_points = loyalty_points.live_share_points + v_points_to_award,
    total_points = loyalty_points.total_points + v_points_to_award,
    updated_at = now();

  -- Get new total
  v_new_total := calculate_total_loyalty_points(p_user_id);

  -- Check if user reached 200 points and should unlock a reward
  IF v_new_total >= 200 AND NOT EXISTS (
    SELECT 1 FROM loyalty_rewards_unlocked
    WHERE user_id = p_user_id
    AND status IN ('pending_choice', 'selected')
  ) THEN
    -- Unlock the main reward
    INSERT INTO loyalty_rewards_unlocked (
      user_id,
      reward_id,
      status,
      expires_at
    )
    SELECT 
      p_user_id,
      id,
      'pending_choice',
      now() + INTERVAL '15 days'
    FROM loyalty_rewards
    WHERE points_required = 200
    AND is_active = true
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', v_points_to_award,
    'new_total', v_new_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add order points (1€ = 1 pt)
CREATE OR REPLACE FUNCTION add_order_points(
  p_user_id uuid,
  p_order_amount numeric
)
RETURNS jsonb AS $$
DECLARE
  v_points integer;
  v_new_total integer;
BEGIN
  v_points := FLOOR(p_order_amount)::integer;

  -- Update loyalty points
  INSERT INTO loyalty_points (user_id, order_points, total_points)
  VALUES (p_user_id, v_points, v_points)
  ON CONFLICT (user_id)
  DO UPDATE SET
    order_points = loyalty_points.order_points + v_points,
    total_points = loyalty_points.total_points + v_points,
    updated_at = now();

  -- Get new total
  v_new_total := calculate_total_loyalty_points(p_user_id);

  -- Check if user reached 200 points
  IF v_new_total >= 200 AND NOT EXISTS (
    SELECT 1 FROM loyalty_rewards_unlocked
    WHERE user_id = p_user_id
    AND status IN ('pending_choice', 'selected')
  ) THEN
    -- Unlock the main reward
    INSERT INTO loyalty_rewards_unlocked (
      user_id,
      reward_id,
      status,
      expires_at
    )
    SELECT 
      p_user_id,
      id,
      'pending_choice',
      now() + INTERVAL '15 days'
    FROM loyalty_rewards
    WHERE points_required = 200
    AND is_active = true
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'points_awarded', v_points,
    'new_total', v_new_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;