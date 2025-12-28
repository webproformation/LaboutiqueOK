/*
  # Mise à jour du montant de parrainage à 5€

  1. Modifications
    - Mettre à jour le type de coupon PARRAINAGE8 en PARRAINAGE5
    - Changer la valeur de 8€ à 5€
    - Mettre à jour la description
    - Mettre à jour les fonctions de traitement du parrainage

  2. Sécurité
    - Pas de changement RLS
*/

-- Mettre à jour le type de coupon existant
UPDATE coupon_types
SET
  code = 'PARRAINAGE5',
  value = 5,
  description = 'Parrainage : 5€ de réduction'
WHERE code = 'PARRAINAGE8';

-- Recréer la fonction de traitement du parrainage avec le nouveau code
CREATE OR REPLACE FUNCTION process_referral(p_referral_code text, p_referred_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_referrer_id uuid;
  v_coupon_type_id uuid;
  v_referrer_coupon_id uuid;
  v_referred_coupon_id uuid;
  v_referral_id uuid;
  v_result jsonb;
BEGIN
  -- Get referrer from code
  SELECT user_id INTO v_referrer_id
  FROM referral_codes
  WHERE code = p_referral_code;

  IF v_referrer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Code de parrainage invalide');
  END IF;

  -- Check if referred user already used a referral code
  IF EXISTS(SELECT 1 FROM referrals WHERE referred_id = p_referred_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vous avez déjà utilisé un code de parrainage');
  END IF;

  -- Get referral coupon type (try PARRAINAGE5 first, fallback to PARRAINAGE8)
  SELECT id INTO v_coupon_type_id
  FROM coupon_types
  WHERE code IN ('PARRAINAGE5', 'PARRAINAGE8')
  ORDER BY CASE WHEN code = 'PARRAINAGE5' THEN 1 ELSE 2 END
  LIMIT 1;

  IF v_coupon_type_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Type de coupon introuvable');
  END IF;

  -- Create coupon for referrer
  INSERT INTO user_coupons (
    user_id,
    coupon_type_id,
    code,
    source,
    valid_until
  )
  VALUES (
    v_referrer_id,
    v_coupon_type_id,
    'PARRAINAGE-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)),
    'loyalty',
    CURRENT_DATE + INTERVAL '90 days'
  )
  RETURNING id INTO v_referrer_coupon_id;

  -- Create coupon for referred
  INSERT INTO user_coupons (
    user_id,
    coupon_type_id,
    code,
    source,
    valid_until
  )
  VALUES (
    p_referred_id,
    v_coupon_type_id,
    'PARRAINAGE-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)),
    'loyalty',
    CURRENT_DATE + INTERVAL '90 days'
  )
  RETURNING id INTO v_referred_coupon_id;

  -- Create referral record
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    referral_code,
    status,
    referrer_coupon_id,
    referred_coupon_id,
    completed_at
  )
  VALUES (
    v_referrer_id,
    p_referred_id,
    p_referral_code,
    'completed',
    v_referrer_coupon_id,
    v_referred_coupon_id,
    now()
  )
  RETURNING id INTO v_referral_id;

  -- Update referral code total
  UPDATE referral_codes
  SET total_referrals = total_referrals + 1,
      updated_at = now()
  WHERE user_id = v_referrer_id;

  RETURN jsonb_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_coupon_id', v_referrer_coupon_id,
    'referred_coupon_id', v_referred_coupon_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;