/*
  # Système de Coupons Croisés - Incitation Live <-> Site

  1. **Vue d'ensemble**
     - Générer des coupons automatiques après commande
     - Inciter les clientes live à acheter sur le site, et inversement
     - Coupons de 2€ pour min 10€ d'achat
     - Validité : 4 jours
     - Non cumulables entre eux et avec la cagnotte fidélité

  2. **Logique**
     - Commande en LIVE → Coupon pour SITE WEB uniquement
     - Commande sur SITE → Coupon pour LIVE/REPLAY uniquement

  3. **Modifications**
     - Ajout de colonnes dans `coupons` :
       * `is_cross_coupon` : Identifie un coupon croisé
       * `source_channel` : 'live' ou 'website'
       * `target_channel` : 'website' ou 'live'
       * `auto_generated` : Généré automatiquement
       * `not_combinable_with_loyalty` : Pas cumulable avec cagnotte

  4. **Fonction automatique**
     - `generate_cross_coupon_for_order` : Génère le coupon après commande
     - Triggered automatiquement ou appelée manuellement

  5. **Sécurité**
     - RLS existant sur la table coupons
     - Fonction SECURITY DEFINER pour génération automatique
*/

-- =====================================================
-- 1. AJOUT DES COLONNES DANS COUPONS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coupons' AND column_name = 'is_cross_coupon'
  ) THEN
    ALTER TABLE coupons ADD COLUMN is_cross_coupon BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coupons' AND column_name = 'source_channel'
  ) THEN
    ALTER TABLE coupons ADD COLUMN source_channel TEXT CHECK (source_channel IN ('live', 'website', NULL));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coupons' AND column_name = 'target_channel'
  ) THEN
    ALTER TABLE coupons ADD COLUMN target_channel TEXT CHECK (target_channel IN ('live', 'website', NULL));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coupons' AND column_name = 'auto_generated'
  ) THEN
    ALTER TABLE coupons ADD COLUMN auto_generated BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coupons' AND column_name = 'not_combinable_with_loyalty'
  ) THEN
    ALTER TABLE coupons ADD COLUMN not_combinable_with_loyalty BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- =====================================================
-- 2. FONCTION DE GÉNÉRATION DE CODE UNIQUE
-- =====================================================

CREATE OR REPLACE FUNCTION generate_unique_coupon_code(
  prefix TEXT DEFAULT 'CROSS'
) RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Générer un code: PREFIX + 8 caractères aléatoires
    v_code := prefix || UPPER(substring(md5(random()::text) from 1 for 8));
    
    -- Vérifier s'il existe déjà
    SELECT EXISTS (
      SELECT 1 FROM coupons WHERE code = v_code
    ) INTO v_exists;
    
    -- Si unique, on sort de la boucle
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. FONCTION DE GÉNÉRATION DE COUPON CROISÉ
-- =====================================================

CREATE OR REPLACE FUNCTION generate_cross_coupon_for_order(
  p_order_id UUID,
  p_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_order RECORD;
  v_coupon_code TEXT;
  v_source_channel TEXT;
  v_target_channel TEXT;
  v_description TEXT;
  v_valid_until TIMESTAMPTZ;
  v_coupon_id UUID;
BEGIN
  -- Récupérer les infos de la commande
  SELECT id, source
  INTO v_order
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Commande introuvable'
    );
  END IF;

  -- Déterminer le canal source et cible
  IF v_order.source = 'live' OR v_order.source = 'replay' THEN
    v_source_channel := 'live';
    v_target_channel := 'website';
    v_description := 'Merci pour ton achat en live ! Voici 2€ pour ta prochaine commande sur le site web (hors live/replay)';
  ELSE
    v_source_channel := 'website';
    v_target_channel := 'live';
    v_description := 'Merci pour ton achat ! Voici 2€ pour ta prochaine commande en live ou replay';
  END IF;

  -- Générer un code unique
  v_coupon_code := generate_unique_coupon_code('CROSS');

  -- Date d'expiration : 4 jours
  v_valid_until := NOW() + INTERVAL '4 days';

  -- Créer le coupon
  INSERT INTO coupons (
    code,
    description,
    discount_type,
    discount_value,
    min_purchase_amount,
    max_usage,
    usage_count,
    valid_from,
    valid_until,
    is_active,
    created_by,
    is_cross_coupon,
    source_channel,
    target_channel,
    auto_generated,
    not_combinable_with_loyalty
  ) VALUES (
    v_coupon_code,
    v_description,
    'fixed',
    2.00,
    10.00,
    1,
    0,
    NOW(),
    v_valid_until,
    TRUE,
    p_user_id,
    TRUE,
    v_source_channel,
    v_target_channel,
    TRUE,
    TRUE
  ) RETURNING id INTO v_coupon_id;

  -- Associer le coupon à l'utilisateur dans user_coupons
  INSERT INTO user_coupons (user_id, coupon_id, assigned_at, is_used)
  VALUES (p_user_id, v_coupon_id, NOW(), FALSE);

  RETURN json_build_object(
    'success', true,
    'message', 'Coupon croisé généré',
    'coupon_code', v_coupon_code,
    'coupon_id', v_coupon_id,
    'valid_until', v_valid_until,
    'description', v_description
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. FONCTION DE VALIDATION DE COUPON
-- =====================================================

CREATE OR REPLACE FUNCTION validate_coupon_for_order(
  p_coupon_code TEXT,
  p_user_id UUID,
  p_order_source TEXT,
  p_order_total DECIMAL,
  p_using_loyalty BOOLEAN DEFAULT FALSE
) RETURNS JSON AS $$
DECLARE
  v_coupon RECORD;
  v_user_coupon RECORD;
BEGIN
  -- Récupérer le coupon
  SELECT *
  INTO v_coupon
  FROM coupons
  WHERE code = p_coupon_code
    AND is_active = TRUE
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW());

  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'Coupon invalide ou expiré'
    );
  END IF;

  -- Vérifier si le coupon est assigné à l'utilisateur
  SELECT *
  INTO v_user_coupon
  FROM user_coupons
  WHERE user_id = p_user_id
    AND coupon_id = v_coupon.id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'Ce coupon ne vous est pas attribué'
    );
  END IF;

  -- Vérifier si déjà utilisé
  IF v_user_coupon.is_used THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'Coupon déjà utilisé'
    );
  END IF;

  -- Si c'est un coupon croisé, vérifier la compatibilité du canal
  IF v_coupon.is_cross_coupon THEN
    IF v_coupon.target_channel = 'website' AND (p_order_source = 'live' OR p_order_source = 'replay') THEN
      RETURN json_build_object(
        'valid', false,
        'message', 'Ce coupon est valable uniquement sur le site web (hors live/replay)'
      );
    END IF;

    IF v_coupon.target_channel = 'live' AND p_order_source != 'live' AND p_order_source != 'replay' THEN
      RETURN json_build_object(
        'valid', false,
        'message', 'Ce coupon est valable uniquement en live ou replay'
      );
    END IF;
  END IF;

  -- Vérifier non cumulable avec fidélité
  IF v_coupon.not_combinable_with_loyalty AND p_using_loyalty THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'Ce coupon n''est pas cumulable avec la cagnotte fidélité'
    );
  END IF;

  -- Vérifier le montant minimum
  IF v_coupon.min_purchase_amount IS NOT NULL AND p_order_total < v_coupon.min_purchase_amount THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'Montant minimum requis: ' || v_coupon.min_purchase_amount || '€'
    );
  END IF;

  -- Tout est OK
  RETURN json_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'message', 'Coupon valide'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. COUPON DE BIENVENUE
-- =====================================================

-- Fonction pour créer un coupon de bienvenue pour un nouvel utilisateur
CREATE OR REPLACE FUNCTION create_welcome_coupon_for_user(
  p_user_id UUID
) RETURNS JSON AS $$
DECLARE
  v_coupon_code TEXT;
  v_valid_until TIMESTAMPTZ;
  v_coupon_id UUID;
  v_already_has_welcome BOOLEAN;
BEGIN
  -- Vérifier si l'utilisateur a déjà un coupon de bienvenue
  SELECT EXISTS (
    SELECT 1 FROM user_coupons uc
    JOIN coupons c ON c.id = uc.coupon_id
    WHERE uc.user_id = p_user_id
      AND c.code LIKE 'WELCOME%'
  ) INTO v_already_has_welcome;

  IF v_already_has_welcome THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Utilisateur possède déjà un coupon de bienvenue'
    );
  END IF;

  -- Générer un code unique
  v_coupon_code := generate_unique_coupon_code('WELCOME');

  -- Validité : 30 jours
  v_valid_until := NOW() + INTERVAL '30 days';

  -- Créer le coupon de bienvenue (5€ pour 35€ d'achat)
  INSERT INTO coupons (
    code,
    description,
    discount_type,
    discount_value,
    min_purchase_amount,
    max_usage,
    usage_count,
    valid_from,
    valid_until,
    is_active,
    created_by,
    auto_generated
  ) VALUES (
    v_coupon_code,
    'Bienvenue ! 5€ offerts sur votre première commande de 35€ minimum',
    'fixed',
    5.00,
    35.00,
    1,
    0,
    NOW(),
    v_valid_until,
    TRUE,
    p_user_id,
    TRUE
  ) RETURNING id INTO v_coupon_id;

  -- Associer le coupon à l'utilisateur
  INSERT INTO user_coupons (user_id, coupon_id, assigned_at, is_used)
  VALUES (p_user_id, v_coupon_id, NOW(), FALSE);

  RETURN json_build_object(
    'success', true,
    'message', 'Coupon de bienvenue créé',
    'coupon_code', v_coupon_code,
    'coupon_id', v_coupon_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;