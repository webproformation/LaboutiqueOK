/*
  # Ajouter intervalles de taille aux variations produits

  ## Description
  Cette migration ajoute les colonnes `size_min` et `size_max` à la table `product_variations`
  pour permettre l'affichage des badges "Match" sur les produits compatibles avec la taille
  de l'utilisateur.

  ## Changements

  ### Table `product_variations`
  - Ajout colonne `size_min` (INTEGER, nullable) : Taille minimale de la variation
  - Ajout colonne `size_max` (INTEGER, nullable) : Taille maximale de la variation

  ## Utilisation

  Ces colonnes permettent de définir un intervalle de tailles pour chaque variation.
  Par exemple, une robe taille 42 pourrait avoir size_min=40 et size_max=44 pour indiquer
  qu'elle convient aux personnes portant du 40 à 44.

  Le système affichera un badge "C'est votre taille !" sur les produits où :
  - user_size >= size_min
  - user_size <= size_max

  ## Notes importantes

  - Les colonnes sont nullables car tous les produits n'ont pas forcément des intervalles
  - Les valeurs doivent être cohérentes : size_min <= size_max
  - Les tailles vont généralement de 34 à 54 pour les vêtements
*/

-- Ajouter les colonnes size_min et size_max à product_variations
ALTER TABLE product_variations
ADD COLUMN IF NOT EXISTS size_min INTEGER,
ADD COLUMN IF NOT EXISTS size_max INTEGER;

-- Ajouter un commentaire pour documentation
COMMENT ON COLUMN product_variations.size_min IS 'Taille minimale compatible avec cette variation (ex: 40)';
COMMENT ON COLUMN product_variations.size_max IS 'Taille maximale compatible avec cette variation (ex: 44)';

-- Créer un index pour optimiser les requêtes de correspondance de taille
CREATE INDEX IF NOT EXISTS idx_product_variations_size_range
ON product_variations(size_min, size_max)
WHERE size_min IS NOT NULL AND size_max IS NOT NULL;
