/*
  # Synchroniser les coupons vers coupon_types (version 3)

  1. Problème identifié
    - Les jeux (wheel, scratch-cards, card-flip) utilisent la table `coupons`
    - La table `user_coupons` référence `coupon_types`
    - Les coupons gagnés ne s'affichent pas car `coupon_types` est vide

  2. Solution
    - Copier tous les coupons actifs de `coupons` vers `coupon_types`
    - Utiliser uniquement les colonnes qui existent avec certitude
    - Mapper correctement les types

  3. Tables modifiées
    - `coupon_types` : Remplissage avec les données de `coupons`
*/

-- Supprimer les anciennes entrées pour repartir à zéro
TRUNCATE TABLE coupon_types CASCADE;

-- Insérer tous les coupons actifs dans coupon_types
INSERT INTO coupon_types (code, type, value, description, valid_until, is_active)
SELECT
  coupons.code,
  CASE
    WHEN coupons.discount_type = 'percentage' THEN 'discount_percentage'
    WHEN coupons.discount_type = 'amount' OR coupons.discount_type = 'fixed' THEN 'discount_amount'
    ELSE 'discount_amount'
  END as type,
  COALESCE(coupons.discount_value, 0) as value,
  coupons.code || ' - Réduction' as description,
  COALESCE(coupons.valid_until, '2026-12-31 23:59:59'::timestamptz) as valid_until,
  coupons.is_active
FROM coupons
WHERE coupons.is_active = true
  AND coupons.code IS NOT NULL
  AND coupons.code != '';