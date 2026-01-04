/*
  # Système de synchronisation du panier entre appareils

  1. Tables
    - `cart_items`
      - `id` (uuid, clé primaire)
      - `user_id` (uuid, référence vers auth.users)
      - `product_id` (text, ID du produit WooCommerce)
      - `product_name` (text)
      - `product_slug` (text)
      - `product_price` (text)
      - `product_image_url` (text, nullable)
      - `quantity` (integer)
      - `variation_data` (jsonb, nullable, pour les variations de produit)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - RLS activé sur `cart_items`
    - Politiques pour que les utilisateurs puissent gérer uniquement leur propre panier

  3. Fonctionnalités
    - Synchronisation automatique du panier entre appareils
    - Conservation du panier lors de la déconnexion
    - Fusion avec le panier local lors de la connexion
*/

-- Créer la table cart_items
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_slug text NOT NULL,
  product_price text NOT NULL,
  product_image_url text,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  variation_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Activer RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Politique SELECT : Les utilisateurs peuvent voir leur propre panier
CREATE POLICY "Users can view own cart items"
  ON cart_items
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Politique INSERT : Les utilisateurs peuvent ajouter des articles à leur panier
CREATE POLICY "Users can add items to own cart"
  ON cart_items
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Politique UPDATE : Les utilisateurs peuvent modifier leur panier
CREATE POLICY "Users can update own cart items"
  ON cart_items
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique DELETE : Les utilisateurs peuvent supprimer des articles de leur panier
CREATE POLICY "Users can delete own cart items"
  ON cart_items
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_cart_items_updated_at_trigger ON cart_items;
CREATE TRIGGER update_cart_items_updated_at_trigger
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_items_updated_at();

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_updated_at ON cart_items(updated_at DESC);