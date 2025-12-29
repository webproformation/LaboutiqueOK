/*
  # Nettoyage final de toutes les policies dupliquées
  
  Ce fichier supprime toutes les policies dupliquées qui causent des problèmes
  avec le cache PostgREST et recrée proprement les policies essentielles.
  
  ## Problème identifié
  
  Entre le 27-28 décembre, plusieurs migrations ont DROP et recréé des policies
  à répétition, créant des doublons et désynchronisant PostgREST.
  
  ## Solution
  
  1. Supprimer toutes les policies dupliquées
  2. Garder uniquement les policies nécessaires
  3. Forcer un reload PostgREST propre
*/

-- Customer reviews: Supprimer les doublons
DROP POLICY IF EXISTS "Allow anon read approved reviews" ON customer_reviews;
DROP POLICY IF EXISTS "Allow anon to view approved reviews" ON customer_reviews;

-- Recréer proprement
CREATE POLICY "Anon can view approved reviews"
  ON customer_reviews
  FOR SELECT
  TO anon
  USING (is_approved = true);

-- Guestbook entries: Nettoyer
DROP POLICY IF EXISTS "Allow anon read approved guestbook entries" ON guestbook_entries;
DROP POLICY IF EXISTS "Allow anon to view approved entries" ON guestbook_entries;

CREATE POLICY "Anon can view approved guestbook"
  ON guestbook_entries
  FOR SELECT
  TO anon
  USING (status = 'approved');

-- Home slides: Nettoyer
DROP POLICY IF EXISTS "Allow anon read active slides" ON home_slides;
DROP POLICY IF EXISTS "Allow public read access to active slides" ON home_slides;

CREATE POLICY "Anon can view active slides"
  ON home_slides
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Home categories: Nettoyer
DROP POLICY IF EXISTS "Allow anon read active categories" ON home_categories;
DROP POLICY IF EXISTS "Allow public to view active categories" ON home_categories;

CREATE POLICY "Anon can view active home categories"
  ON home_categories
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Featured products: Nettoyer
DROP POLICY IF EXISTS "Allow anon read active featured products" ON featured_products;
DROP POLICY IF EXISTS "Anyone can view active featured products" ON featured_products;

CREATE POLICY "Anon can view active featured products"
  ON featured_products
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Weekly ambassadors: Nettoyer
DROP POLICY IF EXISTS "Allow anon read active ambassadors" ON weekly_ambassadors;
DROP POLICY IF EXISTS "Anyone can view active ambassadors" ON weekly_ambassadors;

CREATE POLICY "Anon can view active ambassadors"
  ON weekly_ambassadors
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Guestbook settings: Nettoyer
DROP POLICY IF EXISTS "Allow anon read guestbook settings" ON guestbook_settings;
DROP POLICY IF EXISTS "Anyone can view guestbook settings" ON guestbook_settings;

CREATE POLICY "Anon can view guestbook settings"
  ON guestbook_settings
  FOR SELECT
  TO anon
  USING (true);

-- Live streams: Nettoyer
DROP POLICY IF EXISTS "Allow anon read live streams" ON live_streams;
DROP POLICY IF EXISTS "Anyone can view live streams" ON live_streams;

CREATE POLICY "Anon can view live streams"
  ON live_streams
  FOR SELECT
  TO anon
  USING (true);

-- Scratch game settings: Nettoyer
DROP POLICY IF EXISTS "Allow anon read scratch game settings" ON scratch_game_settings;
DROP POLICY IF EXISTS "Allow anon to read scratch game settings" ON scratch_game_settings;
DROP POLICY IF EXISTS "Anon read game settings" ON scratch_game_settings;

CREATE POLICY "Anon can read scratch game settings"
  ON scratch_game_settings
  FOR SELECT
  TO anon
  USING (true);

-- Wheel game settings: Nettoyer
DROP POLICY IF EXISTS "Allow anon read wheel game settings" ON wheel_game_settings;
DROP POLICY IF EXISTS "Allow anon to read wheel game settings" ON wheel_game_settings;
DROP POLICY IF EXISTS "Anon read wheel settings" ON wheel_game_settings;

CREATE POLICY "Anon can read wheel game settings"
  ON wheel_game_settings
  FOR SELECT
  TO anon
  USING (true);

-- Gift thresholds: Nettoyer
DROP POLICY IF EXISTS "Allow anon to view active gift thresholds" ON gift_thresholds;
DROP POLICY IF EXISTS "Anon can view active thresholds" ON gift_thresholds;

CREATE POLICY "Anon can view active gift thresholds"
  ON gift_thresholds
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Delivery batches: Nettoyer
DROP POLICY IF EXISTS "Allow anon to view active batches" ON delivery_batches;
DROP POLICY IF EXISTS "Anon can view active batches" ON delivery_batches;

CREATE POLICY "Anon can view delivery batches"
  ON delivery_batches
  FOR SELECT
  TO anon
  USING (true);

-- Shipping methods: Nettoyer
DROP POLICY IF EXISTS "Allow anon to view shipping methods" ON shipping_methods;
DROP POLICY IF EXISTS "Anon can view shipping methods" ON shipping_methods;

CREATE POLICY "Anon can view active shipping methods"
  ON shipping_methods
  FOR SELECT
  TO anon
  USING (is_active = true);

-- WooCommerce cache: Nettoyer
DROP POLICY IF EXISTS "Anyone can view cached categories" ON woocommerce_categories_cache;
DROP POLICY IF EXISTS "Allow anon to view categories cache" ON woocommerce_categories_cache;

CREATE POLICY "Anon can view categories cache"
  ON woocommerce_categories_cache
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Anyone can view cached products" ON woocommerce_products_cache;
DROP POLICY IF EXISTS "Allow anon to view products cache" ON woocommerce_products_cache;

CREATE POLICY "Anon can view products cache"
  ON woocommerce_products_cache
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- SEO metadata: Nettoyer
DROP POLICY IF EXISTS "Allow anon to read SEO metadata" ON seo_metadata;
DROP POLICY IF EXISTS "Anon can read seo metadata" ON seo_metadata;

CREATE POLICY "Anon can view seo metadata"
  ON seo_metadata
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- News categories: Nettoyer
DROP POLICY IF EXISTS "Allow anon to read news categories" ON news_categories;
DROP POLICY IF EXISTS "Anon can read news categories" ON news_categories;

CREATE POLICY "Anon can view news categories"
  ON news_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Looks: Nettoyer  
DROP POLICY IF EXISTS "Allow anon to view active looks" ON looks;
DROP POLICY IF EXISTS "Anon can view active looks" ON looks;

CREATE POLICY "Anon can view looks"
  ON looks
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';