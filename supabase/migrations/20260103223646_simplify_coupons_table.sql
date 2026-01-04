/*
  # Simplification de la table coupons

  1. Modifications
    - Ajoute la colonne `discount_type` (percent ou amount)
    - Rend `coupon_type_id` nullable pour ne plus dépendre de coupon_types
    - Valeur par défaut 'amount' pour discount_type
  
  2. Sécurité
    - Aucune modification des policies RLS existantes
    - Les données existantes ne sont pas perdues
*/

-- Ajouter la colonne discount_type si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'coupons' AND column_name = 'discount_type'
  ) THEN
    ALTER TABLE coupons 
    ADD COLUMN discount_type text DEFAULT 'amount' CHECK (discount_type IN ('percent', 'amount'));
  END IF;
END $$;

-- Rendre coupon_type_id nullable pour ne plus dépendre de coupon_types
ALTER TABLE coupons 
ALTER COLUMN coupon_type_id DROP NOT NULL;

-- Mettre à jour les coupons existants pour avoir un discount_type
UPDATE coupons 
SET discount_type = 'amount' 
WHERE discount_type IS NULL;