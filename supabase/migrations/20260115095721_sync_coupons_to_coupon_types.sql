/*
  # Synchroniser les coupons vers coupon_types

  1. Problème identifié
    - Les jeux (wheel, scratch-cards, card-flip) utilisent la table `coupons`
    - La table `user_coupons` référence `coupon_types`
    - Les coupons gagnés ne s'affichent pas car `coupon_types` est vide

  2. Solution
    - Copier tous les coupons actifs de `coupons` vers `coupon_types`
    - Mapper correctement les types et valeurs
    - Ne pas créer de doublons

  3. Tables modifiées
    - `coupon_types` : Remplissage avec les données de `coupons`
*/

-- Insérer tous les coupons actifs dans coupon_types (si pas déjà présents)
INSERT INTO coupon_types (code, type, value, description, valid_until, is_active)
SELECT
  c.code,
  CASE
    WHEN c.discount_type = 'percentage' THEN 'discount_percentage'
    WHEN c.discount_type = 'amount' OR c.discount_type = 'fixed' THEN 'discount_amount'
    ELSE 'discount_amount'
  END as type,
  c.discount_value,
  COALESCE(c.code, 'Réduction') as description,
  COALESCE(c.valid_until, '2026-12-31 23:59:59'::timestamptz) as valid_until,
  c.is_active
FROM coupons c
WHERE c.is_active = true
ON CONFLICT (code) DO UPDATE SET
  type = EXCLUDED.type,
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  valid_until = EXCLUDED.valid_until,
  is_active = EXCLUDED.is_active;