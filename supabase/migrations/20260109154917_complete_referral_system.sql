/*
  # Complétion du Système de Parrainage

  1. Modifications de referral_codes
    - Ajout de `reward_type` (text) - Type de récompense
    - Ajout de `reward_value` (numeric) - Valeur de la récompense en euros
    - Ajout de `expires_at` (timestamptz, nullable) - Date d'expiration

  2. Nouvelle Table referral_uses
    - `id` (uuid, primary key)
    - `referral_code` (text) - Code utilisé
    - `referred_user_id` (uuid, FK vers auth.users) - Utilisateur parrainé
    - `order_id` (uuid, FK vers orders) - Commande associée
    - `sponsor_credited` (boolean) - Parrain crédité
    - `referred_credited` (boolean) - Parrainé crédité
    - `created_at` (timestamptz)

  3. Sécurité
    - Enable RLS sur referral_uses
    - Les utilisateurs peuvent voir l'historique de leurs parrainages
*/

-- Ajouter les colonnes manquantes à referral_codes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referral_codes' AND column_name = 'reward_type'
  ) THEN
    ALTER TABLE referral_codes ADD COLUMN reward_type text DEFAULT 'wallet_credit' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referral_codes' AND column_name = 'reward_value'
  ) THEN
    ALTER TABLE referral_codes ADD COLUMN reward_value numeric(10,2) DEFAULT 5.00 NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'referral_codes' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE referral_codes ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

-- Mettre à jour la politique pour inclure expires_at
DROP POLICY IF EXISTS "Public can view active referral codes for validation" ON referral_codes;
CREATE POLICY "Public can view active referral codes for validation"
  ON referral_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Table referral_uses
CREATE TABLE IF NOT EXISTS referral_uses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code text NOT NULL,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  sponsor_credited boolean DEFAULT false NOT NULL,
  referred_credited boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT unique_referred_user UNIQUE(referred_user_id)
);

ALTER TABLE referral_uses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view referral uses where they are sponsor"
  ON referral_uses FOR SELECT
  TO authenticated
  USING (
    referral_code IN (
      SELECT code FROM referral_codes WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own referral use"
  ON referral_uses FOR SELECT
  TO authenticated
  USING (auth.uid() = referred_user_id);

CREATE POLICY "System can insert referral uses"
  ON referral_uses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update referral credits"
  ON referral_uses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_referral_uses_code ON referral_uses(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_uses_referred ON referral_uses(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_uses_order ON referral_uses(order_id);

-- Fonction pour incrémenter le compteur d'usage
CREATE OR REPLACE FUNCTION increment_referral_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE referral_codes
  SET usage_count = usage_count + 1
  WHERE code = NEW.referral_code;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour incrémenter automatiquement
DROP TRIGGER IF EXISTS trigger_increment_referral_usage ON referral_uses;
CREATE TRIGGER trigger_increment_referral_usage
  AFTER INSERT ON referral_uses
  FOR EACH ROW
  EXECUTE FUNCTION increment_referral_usage();