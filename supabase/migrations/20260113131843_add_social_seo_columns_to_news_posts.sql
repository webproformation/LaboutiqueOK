/*
  # Ajouter les colonnes SEO Social à news_posts

  1. Nouvelles Colonnes
    - `meta_social_title` (text, nullable) - Titre personnalisé pour les réseaux sociaux
    - `meta_social_description` (text, nullable) - Description personnalisée pour les réseaux sociaux
    - `meta_social_image` (text, nullable) - URL de l'image personnalisée pour les réseaux sociaux

  2. Notes
    - Ces colonnes permettent de personnaliser l'apparence des articles partagés sur Facebook, Twitter, etc.
    - Si elles sont vides, les valeurs par défaut (title, excerpt, featured_image_url) seront utilisées
*/

-- Ajouter les colonnes SEO social
ALTER TABLE news_posts 
ADD COLUMN IF NOT EXISTS meta_social_title text,
ADD COLUMN IF NOT EXISTS meta_social_description text,
ADD COLUMN IF NOT EXISTS meta_social_image text;