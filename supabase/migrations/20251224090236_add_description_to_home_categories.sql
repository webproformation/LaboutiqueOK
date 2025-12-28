/*
  # Ajouter le champ description aux catégories d'accueil

  1. Modifications
    - Ajoute le champ `description` (text, nullable) à la table `home_categories`
    - Permet de stocker une description pour chaque catégorie affichée sur la page d'accueil
    
  2. Notes
    - Le champ est nullable pour ne pas casser les catégories existantes
    - La description sera modifiable dans l'interface d'administration
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'home_categories' AND column_name = 'description'
  ) THEN
    ALTER TABLE home_categories ADD COLUMN description text;
  END IF;
END $$;