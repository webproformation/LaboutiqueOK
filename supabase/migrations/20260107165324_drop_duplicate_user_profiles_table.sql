/*
  # Suppression table user_profiles en double

  1. Problème
    - Deux tables de profils existent : profiles et user_profiles
    - Cela cause des conflits lors de la création d'utilisateurs
    - Le trigger on_auth_user_created échoue

  2. Solution
    - Supprimer la table user_profiles en double
    - Garder uniquement la table profiles qui est complète

  3. Sécurité
    - Vérifier d'abord s'il y a des données
    - CASCADE pour supprimer les foreign keys
*/

-- Supprimer la table user_profiles en double
DROP TABLE IF EXISTS public.user_profiles CASCADE;
