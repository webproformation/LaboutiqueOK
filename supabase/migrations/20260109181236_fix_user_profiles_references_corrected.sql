/*
  # Correction des Références à user_profiles (Migration vers profiles)
  
  1. Problème
    - Plusieurs politiques RLS référencent encore l'ancienne table user_profiles
    - Cette table a été supprimée en faveur de profiles
    - Causes des erreurs lors de la création de codes de parrainage
    
  2. Corrections
    - Mettre à jour toutes les politiques RLS pour utiliser profiles au lieu de user_profiles
    - Corriger les vérifications is_admin
    
  3. Sécurité
    - Maintien des contrôles d'accès admin existants
    - Utilisation de profiles.is_admin au lieu de user_profiles.is_admin
*/

-- Corriger les politiques RLS pour la table categories
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
  DROP POLICY IF EXISTS "Admins can update categories" ON categories;
  DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
  
  CREATE POLICY "Admins can insert categories"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );
  
  CREATE POLICY "Admins can update categories"
    ON categories FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );
  
  CREATE POLICY "Admins can delete categories"
    ON categories FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );
    
  RAISE NOTICE 'Politiques mises à jour pour categories';
END $$;

-- Corriger les politiques RLS pour la table products
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can insert products" ON products;
  DROP POLICY IF EXISTS "Admins can update products" ON products;
  DROP POLICY IF EXISTS "Admins can delete products" ON products;
  
  CREATE POLICY "Admins can insert products"
    ON products FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );
  
  CREATE POLICY "Admins can update products"
    ON products FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );
  
  CREATE POLICY "Admins can delete products"
    ON products FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );
    
  RAISE NOTICE 'Politiques mises à jour pour products';
END $$;

-- Corriger les politiques RLS pour la table coupons
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can insert coupons" ON coupons;
  DROP POLICY IF EXISTS "Admins can update coupons" ON coupons;
  DROP POLICY IF EXISTS "Admins can delete coupons" ON coupons;
  
  CREATE POLICY "Admins can insert coupons"
    ON coupons FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );
  
  CREATE POLICY "Admins can update coupons"
    ON coupons FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );
  
  CREATE POLICY "Admins can delete coupons"
    ON coupons FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );
    
  RAISE NOTICE 'Politiques mises à jour pour coupons';
END $$;

-- Corriger les politiques RLS pour la table coupon_types
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can insert coupon_types" ON coupon_types;
  DROP POLICY IF EXISTS "Admins can update coupon_types" ON coupon_types;
  DROP POLICY IF EXISTS "Admins can delete coupon_types" ON coupon_types;
  
  CREATE POLICY "Admins can insert coupon_types"
    ON coupon_types FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );
  
  CREATE POLICY "Admins can update coupon_types"
    ON coupon_types FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );
  
  CREATE POLICY "Admins can delete coupon_types"
    ON coupon_types FOR DELETE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
      )
    );
    
  RAISE NOTICE 'Politiques mises à jour pour coupon_types';
END $$;

-- Vérifier que referral_codes pointe bien vers profiles
DO $$
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'referral_codes_user_id_fkey'
      AND table_name = 'referral_codes'
  ) THEN
    ALTER TABLE referral_codes
      DROP CONSTRAINT referral_codes_user_id_fkey;
  END IF;
  
  -- Recréer la contrainte vers profiles
  ALTER TABLE referral_codes
    ADD CONSTRAINT referral_codes_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
    
  RAISE NOTICE 'Contrainte FK referral_codes.user_id -> profiles.id recréée';
END $$;