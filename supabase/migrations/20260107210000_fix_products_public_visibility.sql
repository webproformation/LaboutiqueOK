/*
  # Correction RLS Produits - Visibilité Publique
  
  1. Problème
    - Les produits ne sont visibles que pour les admins connectés
    - Le public ne peut pas voir les produits
  
  2. Solution
    - Ajouter une policy SELECT publique pour tous les produits
    - Permettre à tout le monde (anon, authenticated) de voir les produits
  
  3. Sécurité
    - Lecture publique : OUI (catalogue e-commerce)
    - Écriture : NON (réservée aux admins)
*/

-- Supprimer les policies restrictives existantes si elles existent
DROP POLICY IF EXISTS "Admin can view all products" ON products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON products;
DROP POLICY IF EXISTS "Only admins can view products" ON products;

-- Créer une policy de lecture publique pour TOUS les produits
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

-- Les policies d'écriture restent restrictives (admins seulement)
DROP POLICY IF EXISTS "Admin can insert products" ON products;
DROP POLICY IF EXISTS "Admin can update products" ON products;
DROP POLICY IF EXISTS "Admin can delete products" ON products;

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
