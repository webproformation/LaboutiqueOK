/*
  # Correction de la Clé Étrangère referral_codes.user_id
  
  1. Modification
    - Ajout de la contrainte de clé étrangère user_id vers profiles.id
    
  2. Sécurité
    - La table referral_codes est déjà protégée par RLS
    - Cette modification garantit l'intégrité référentielle
*/

-- Ajouter la contrainte de clé étrangère si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'referral_codes_user_id_fkey'
      AND table_name = 'referral_codes'
  ) THEN
    ALTER TABLE referral_codes
      ADD CONSTRAINT referral_codes_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;
