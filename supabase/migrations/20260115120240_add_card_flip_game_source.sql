/*
  # Ajouter 'card_flip_game' comme source de coupon valide

  1. Changements
    - Modifier la contrainte CHECK sur user_coupons.source
    - Ajouter 'card_flip_game' aux valeurs autorisées

  2. Sécurité
    - Aucune modification des politiques RLS
*/

-- Supprimer l'ancienne contrainte
ALTER TABLE user_coupons DROP CONSTRAINT IF EXISTS user_coupons_source_check;

-- Ajouter la nouvelle contrainte avec 'card_flip_game'
ALTER TABLE user_coupons
  ADD CONSTRAINT user_coupons_source_check
  CHECK (source IN ('wheel', 'scratch', 'card_flip_game', 'referral', 'admin', 'welcome'));
