/*
  # Désactivation temporaire du trigger

  1. Objectif
    - Désactiver le trigger pour débugger
    - Permettre la création manuelle de comptes
*/

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
