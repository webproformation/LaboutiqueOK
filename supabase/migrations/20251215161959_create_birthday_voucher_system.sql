/*
  # Système de chèques anniversaire automatiques

  1. Nouvelles tables
    - `birthday_vouchers` : Gestion des chèques anniversaire
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key vers auth.users)
      - `coupon_type_id` (uuid, foreign key vers coupon_types)
      - `year` (integer, année du chèque)
      - `sent_at` (timestamptz, date d'envoi)
      - `user_coupon_id` (uuid, foreign key vers user_coupons)
      - `created_at` (timestamptz)

  2. Type de coupon par défaut
    - Créer un type de coupon "BIRTHDAY8" pour les anniversaires
    - 8€ de réduction pour minimum 20€ d'achat
    - Valable 10 jours

  3. Fonction automatique
    - Fonction pour générer automatiquement les chèques 3 jours avant l'anniversaire
    - Vérification qu'un seul chèque est généré par an

  4. Sécurité
    - Enable RLS sur `birthday_vouchers`
    - Policies pour que les clients voient leurs propres chèques
    - Policies admin pour gérer tous les chèques
*/

-- Create birthday_vouchers table
CREATE TABLE IF NOT EXISTS birthday_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  coupon_type_id uuid REFERENCES coupon_types(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  sent_at timestamptz DEFAULT now(),
  user_coupon_id uuid REFERENCES user_coupons(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year)
);

-- Enable RLS
ALTER TABLE birthday_vouchers ENABLE ROW LEVEL SECURITY;

-- Policies for birthday_vouchers
CREATE POLICY "Users can view own birthday vouchers"
  ON birthday_vouchers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all birthday vouchers"
  ON birthday_vouchers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert birthday vouchers"
  ON birthday_vouchers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_birthday_vouchers_user_id ON birthday_vouchers(user_id);
CREATE INDEX IF NOT EXISTS idx_birthday_vouchers_year ON birthday_vouchers(year);

-- Create or update birthday coupon type
DO $$
DECLARE
  v_coupon_type_id uuid;
BEGIN
  -- Check if birthday coupon type exists
  SELECT id INTO v_coupon_type_id
  FROM coupon_types
  WHERE code = 'BIRTHDAY8';

  IF v_coupon_type_id IS NULL THEN
    -- Create birthday coupon type
    INSERT INTO coupon_types (
      code,
      type,
      value,
      description,
      valid_until,
      is_active
    )
    VALUES (
      'BIRTHDAY8',
      'discount_amount',
      8,
      'Bon anniversaire ! 8€ de réduction pour un minimum d''achat de 20€',
      '2099-12-31'::timestamptz,
      true
    );
  END IF;
END $$;

-- Function to generate birthday vouchers for eligible users
CREATE OR REPLACE FUNCTION generate_birthday_vouchers()
RETURNS void AS $$
DECLARE
  v_profile RECORD;
  v_coupon_type_id uuid;
  v_user_coupon_id uuid;
  v_current_year integer;
  v_coupon_code text;
BEGIN
  -- Get the birthday coupon type
  SELECT id INTO v_coupon_type_id
  FROM coupon_types
  WHERE code = 'BIRTHDAY8'
  LIMIT 1;

  IF v_coupon_type_id IS NULL THEN
    RAISE EXCEPTION 'Birthday coupon type not found';
  END IF;

  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);

  -- Find users whose birthday is in 3 days and haven't received their voucher this year
  FOR v_profile IN
    SELECT p.id, p.email, p.first_name, p.birth_date
    FROM profiles p
    WHERE p.birth_date IS NOT NULL
    AND EXTRACT(MONTH FROM p.birth_date) = EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '3 days')
    AND EXTRACT(DAY FROM p.birth_date) = EXTRACT(DAY FROM CURRENT_DATE + INTERVAL '3 days')
    AND NOT EXISTS (
      SELECT 1
      FROM birthday_vouchers bv
      WHERE bv.user_id = p.id
      AND bv.year = v_current_year
    )
  LOOP
    -- Generate unique coupon code
    v_coupon_code := 'BIRTHDAY-' || UPPER(SUBSTRING(v_profile.id::text, 1, 8)) || '-' || v_current_year;

    -- Create user coupon
    INSERT INTO user_coupons (
      user_id,
      coupon_type_id,
      code,
      source,
      valid_until
    )
    VALUES (
      v_profile.id,
      v_coupon_type_id,
      v_coupon_code,
      'gift',
      CURRENT_DATE + INTERVAL '13 days' -- 3 days before + 10 days validity
    )
    RETURNING id INTO v_user_coupon_id;

    -- Record birthday voucher
    INSERT INTO birthday_vouchers (
      user_id,
      coupon_type_id,
      year,
      user_coupon_id
    )
    VALUES (
      v_profile.id,
      v_coupon_type_id,
      v_current_year,
      v_user_coupon_id
    );

  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;