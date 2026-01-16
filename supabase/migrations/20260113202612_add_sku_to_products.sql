/*
  # Ajout du champ SKU aux produits

  1. Modifications
    - Ajoute la colonne `sku` à la table `products`
    - SKU = Unité de Gestion des Stocks (Stock Keeping Unit)
    - Ce champ permettra d'identifier unique chaque produit

  2. Notes
    - Le champ est nullable pour ne pas casser les produits existants
    - Peut être rempli manuellement par l'admin
    - Sera affiché dans panier, checkout, commandes et PDFs
*/

-- Ajouter le champ SKU aux produits
ALTER TABLE products
ADD COLUMN IF NOT EXISTS sku text;

-- Créer un index pour les recherches par SKU
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Ajouter un commentaire
COMMENT ON COLUMN products.sku IS 'Unité de Gestion des Stocks - Référence unique du produit';
