/*
  ========================================
  MIGRATION COMPLÈTE - NOUVEAU PROJET
  ========================================

  Ce script contient toute la structure de la base de données
  pour le site La Boutique de Morgane.

  Exécute ce script dans le SQL Editor de ton nouveau projet Supabase.

  Tables créées:
  - user_profiles: Profils utilisateurs avec mesures et préférences
  - addresses: Adresses de livraison
  - orders & order_items: Système de commandes
  - order_invoices: Factures PDF
  - wishlist_items: Liste de souhaits
  - cart_items: Panier synchronisé
  - loyalty_points & loyalty_tiers: Système de fidélité
  - coupons & user_coupons: Bons de réduction
  - product_availability_notifications: Alertes stock
  - home_slides: Slider homepage
  - featured_products: Produits mis en avant
  - home_categories: Catégories homepage
  - scratch_game_settings & scratch_game_prizes: Jeu de grattage
  - wheel_game_settings & wheel_game_prizes: Roue de la fortune
  - pending_prizes: Prix en attente
  - live_streams & live_chat_messages: Live streaming
  - analytics_sessions & page_visits: Analytics
  - cookie_consent_logs: RGPD
  - contact_messages: Formulaire de contact
  - customer_reviews: Avis clients
  - guestbook_entries: Livre d'or
  - news_categories & news_posts: Actualités
  - diamond_finds: Diamants cachés
  - referral_system: Parrainage
  - birthday_vouchers: Bons d'anniversaire
  - weekly_ambassadors: Ambassadrice de la semaine
  - looks_bundles: Looks de Morgane
  - gift_thresholds: Cadeaux par seuil
  - push_subscriptions: Notifications push
  - returns & return_items: Retours produits
  - delivery_batches: Lots de livraison
  - shipping_methods: Méthodes de livraison
  - woocommerce_cache: Cache WooCommerce
*/

-- ============================================
-- 1. EXTENSION pg_cron pour les tâches automatisées
-- ============================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 2. TABLES PRINCIPALES
-- ============================================

-- Table user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  birth_date date,
  avatar_url text,
  wallet_balance decimal(10,2) DEFAULT 0,
  is_blocked boolean DEFAULT false,
  blocked_reason text,
  admin_notes text,
  admin_access boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table client_measurements (mesures et préférences client)
CREATE TABLE IF NOT EXISTS client_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  height integer,
  weight integer,
  bust_size text,
  waist_size integer,
  hip_size integer,
  shoe_size decimal(3,1),
  dress_size text,
  top_size text,
  bottom_size text,
  preferred_style text,
  color_preferences text[],
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Table client_preferences
CREATE TABLE IF NOT EXISTS client_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  newsletter boolean DEFAULT false,
  sms_notifications boolean DEFAULT false,
  push_notifications boolean DEFAULT false,
  email_promotions boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Table addresses
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  label text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  company text,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  postal_code text NOT NULL,
  country text NOT NULL DEFAULT 'FR',
  phone text,
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table orders
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  order_number text UNIQUE NOT NULL,
  woocommerce_order_id integer UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  total_amount decimal(10,2) NOT NULL,
  shipping_amount decimal(10,2) DEFAULT 0,
  tax_amount decimal(10,2) DEFAULT 0,
  discount_amount decimal(10,2) DEFAULT 0,
  coupon_code text,
  payment_method text,
  payment_intent_id text,
  stripe_payment_intent_id text,
  shipping_address jsonb,
  billing_address jsonb,
  customer_notes text,
  admin_notes text,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table order_items
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id integer NOT NULL,
  variation_id integer,
  product_name text NOT NULL,
  product_sku text,
  quantity integer NOT NULL,
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Table order_invoices
CREATE TABLE IF NOT EXISTS order_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number text UNIQUE NOT NULL,
  invoice_date date NOT NULL,
  pdf_url text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(order_id)
);

-- Table wishlist_items
CREATE TABLE IF NOT EXISTS wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id integer NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Table cart_items
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id text,
  product_id integer NOT NULL,
  variation_id integer,
  quantity integer NOT NULL DEFAULT 1,
  added_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_cart_item UNIQUE NULLS NOT DISTINCT (user_id, session_id, product_id, variation_id)
);

-- Table loyalty_tiers
CREATE TABLE IF NOT EXISTS loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  points_required integer NOT NULL,
  discount_percentage integer DEFAULT 0,
  benefits text[],
  color text,
  created_at timestamptz DEFAULT now()
);

-- Table loyalty_points
CREATE TABLE IF NOT EXISTS loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  points integer DEFAULT 0,
  tier_id uuid REFERENCES loyalty_tiers(id),
  total_earned integer DEFAULT 0,
  total_spent integer DEFAULT 0,
  current_tier_progress decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Table loyalty_transactions
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  points integer NOT NULL,
  type text NOT NULL,
  description text,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Table coupon_types
CREATE TABLE IF NOT EXISTS coupon_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL,
  value decimal(10,2) NOT NULL,
  min_purchase decimal(10,2),
  max_uses integer,
  current_uses integer DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Table user_coupons
CREATE TABLE IF NOT EXISTS user_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  coupon_id uuid REFERENCES coupon_types(id) ON DELETE CASCADE,
  code text NOT NULL,
  is_used boolean DEFAULT false,
  used_at timestamptz,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Table product_availability_notifications
CREATE TABLE IF NOT EXISTS product_availability_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  product_id integer NOT NULL,
  variation_id integer,
  notified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Table home_slides
CREATE TABLE IF NOT EXISTS home_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text NOT NULL,
  mobile_image_url text,
  link_url text,
  button_text text,
  button_url text,
  order_position integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table featured_products
CREATE TABLE IF NOT EXISTS featured_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id integer UNIQUE NOT NULL,
  order_position integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  is_hidden_diamond boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Table home_categories
CREATE TABLE IF NOT EXISTS home_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id integer UNIQUE NOT NULL,
  category_name text NOT NULL,
  category_slug text NOT NULL,
  image_url text,
  description text,
  order_position integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table scratch_game_settings
CREATE TABLE IF NOT EXISTS scratch_game_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  max_plays_per_day integer DEFAULT 1,
  requires_purchase boolean DEFAULT false,
  min_purchase_amount decimal(10,2),
  updated_at timestamptz DEFAULT now()
);

-- Table scratch_game_prizes
CREATE TABLE IF NOT EXISTS scratch_game_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  value decimal(10,2),
  label text NOT NULL,
  probability decimal(5,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table wheel_game_settings
CREATE TABLE IF NOT EXISTS wheel_game_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  show_popup boolean DEFAULT true,
  max_plays_per_day integer DEFAULT 1,
  requires_email boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Table wheel_game_prizes
CREATE TABLE IF NOT EXISTS wheel_game_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  value decimal(10,2),
  label text NOT NULL,
  color text NOT NULL,
  probability decimal(5,2) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table pending_prizes
CREATE TABLE IF NOT EXISTS pending_prizes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  email text,
  game_type text NOT NULL,
  prize_type text NOT NULL,
  prize_value decimal(10,2),
  prize_label text NOT NULL,
  is_claimed boolean DEFAULT false,
  claimed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Table live_streams
CREATE TABLE IF NOT EXISTS live_streams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  thumbnail_url text,
  stream_url text NOT NULL,
  replay_url text,
  is_live boolean DEFAULT false,
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  viewer_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table live_chat_messages
CREATE TABLE IF NOT EXISTS live_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  username text NOT NULL,
  avatar_url text,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table live_stream_products
CREATE TABLE IF NOT EXISTS live_stream_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id uuid REFERENCES live_streams(id) ON DELETE CASCADE,
  product_id integer NOT NULL,
  order_position integer DEFAULT 0,
  added_at timestamptz DEFAULT now()
);

-- Table analytics_sessions
CREATE TABLE IF NOT EXISTS analytics_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  started_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  user_agent text,
  ip_address inet,
  device_type text,
  browser text,
  os text,
  UNIQUE(session_id)
);

-- Table page_visits
CREATE TABLE IF NOT EXISTS page_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES analytics_sessions(id) ON DELETE CASCADE,
  page_url text NOT NULL,
  page_title text,
  referrer text,
  visited_at timestamptz DEFAULT now()
);

-- Table cookie_consent_logs
CREATE TABLE IF NOT EXISTS cookie_consent_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  session_id text,
  consent_given boolean NOT NULL,
  analytics_cookies boolean DEFAULT false,
  marketing_cookies boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Table contact_messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'new',
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table customer_reviews
CREATE TABLE IF NOT EXISTS customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  product_id integer,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  comment text NOT NULL,
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  admin_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table facebook_reviews
CREATE TABLE IF NOT EXISTS facebook_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  review_date date NOT NULL,
  facebook_url text,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Table guestbook_settings
CREATE TABLE IF NOT EXISTS guestbook_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requires_purchase boolean DEFAULT false,
  min_purchase_amount decimal(10,2) DEFAULT 0,
  auto_approve boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Table guestbook_entries
CREATE TABLE IF NOT EXISTS guestbook_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  order_number text,
  customer_name text NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message text NOT NULL CHECK (char_length(message) <= 500),
  photo_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_response text,
  likes_count int DEFAULT 0,
  reward_amount numeric(10,2) DEFAULT 0.20,
  reward_applied boolean DEFAULT false,
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'facebook')),
  rgpd_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz
);

-- Table guestbook_likes
CREATE TABLE IF NOT EXISTS guestbook_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid REFERENCES guestbook_entries(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  session_id text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entry_id, user_id),
  UNIQUE(entry_id, session_id)
);

-- Table news_categories
CREATE TABLE IF NOT EXISTS news_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Table news_posts
CREATE TABLE IF NOT EXISTS news_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_post_id integer UNIQUE,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text,
  featured_image text,
  category_id uuid REFERENCES news_categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  is_published boolean DEFAULT false,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table seo_metadata
CREATE TABLE IF NOT EXISTS seo_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  meta_title text,
  meta_description text,
  meta_keywords text[],
  og_title text,
  og_description text,
  og_image text,
  canonical_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

-- Table diamond_finds
CREATE TABLE IF NOT EXISTS diamond_finds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  product_id integer NOT NULL,
  reward_amount decimal(10,2) DEFAULT 0.10,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Table referral_codes
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  uses integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Table referrals
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  code_used text NOT NULL,
  referrer_reward decimal(10,2) DEFAULT 5.00,
  referred_reward decimal(10,2) DEFAULT 5.00,
  is_rewarded boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Table birthday_vouchers
CREATE TABLE IF NOT EXISTS birthday_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  year integer NOT NULL,
  code text UNIQUE NOT NULL,
  value decimal(10,2) DEFAULT 10.00,
  is_sent boolean DEFAULT false,
  sent_at timestamptz,
  is_used boolean DEFAULT false,
  used_at timestamptz,
  expires_at date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, year)
);

-- Table weekly_ambassadors
CREATE TABLE IF NOT EXISTS weekly_ambassadors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  total_points integer NOT NULL,
  reward_amount decimal(10,2) DEFAULT 0,
  is_rewarded boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Table looks_bundles
CREATE TABLE IF NOT EXISTS looks_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  discount_percentage integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table looks_bundle_products
CREATE TABLE IF NOT EXISTS looks_bundle_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id uuid REFERENCES looks_bundles(id) ON DELETE CASCADE,
  product_id integer NOT NULL,
  order_position integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Table gift_thresholds
CREATE TABLE IF NOT EXISTS gift_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  threshold_amount decimal(10,2) NOT NULL,
  gift_product_id integer NOT NULL,
  gift_name text NOT NULL,
  gift_image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table push_subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  subscription_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table push_notifications
CREATE TABLE IF NOT EXISTS push_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  url text,
  image_url text,
  sent_to text,
  sent_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Table returns
CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE,
  return_number text UNIQUE NOT NULL,
  reason text NOT NULL,
  status text DEFAULT 'pending',
  refund_amount decimal(10,2),
  refund_method text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table return_items
CREATE TABLE IF NOT EXISTS return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid REFERENCES returns(id) ON DELETE CASCADE,
  order_item_id uuid REFERENCES order_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table delivery_batches
CREATE TABLE IF NOT EXISTS delivery_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  delivery_date date NOT NULL,
  cutoff_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table shipping_methods
CREATE TABLE IF NOT EXISTS shipping_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  base_cost decimal(10,2) NOT NULL,
  free_threshold decimal(10,2),
  estimated_days text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Table newsletter_subscriptions
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  subscribed_at timestamptz DEFAULT now(),
  unsubscribed_at timestamptz
);

-- Table woocommerce_cache
CREATE TABLE IF NOT EXISTS woocommerce_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  cache_data jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 3. STORAGE BUCKETS
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('order-documents', 'order-documents', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_availability_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE scratch_game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE scratch_game_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_game_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_stream_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE cookie_consent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE diamond_finds ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE looks_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE looks_bundle_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE woocommerce_cache ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. POLICIES RLS - PUBLIC READ (TOUS)
-- ============================================

-- Tables avec lecture publique pour tous
CREATE POLICY "Public read home_slides" ON home_slides FOR SELECT USING (is_active = true);
CREATE POLICY "Public read featured_products" ON featured_products FOR SELECT USING (is_active = true);
CREATE POLICY "Public read home_categories" ON home_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read loyalty_tiers" ON loyalty_tiers FOR SELECT USING (true);
CREATE POLICY "Public read coupon_types" ON coupon_types FOR SELECT USING (is_active = true);
CREATE POLICY "Public read scratch_game_settings" ON scratch_game_settings FOR SELECT USING (true);
CREATE POLICY "Public read scratch_game_prizes" ON scratch_game_prizes FOR SELECT USING (is_active = true);
CREATE POLICY "Public read wheel_game_settings" ON wheel_game_settings FOR SELECT USING (true);
CREATE POLICY "Public read wheel_game_prizes" ON wheel_game_prizes FOR SELECT USING (is_active = true);
CREATE POLICY "Public read live_streams" ON live_streams FOR SELECT USING (true);
CREATE POLICY "Public read live_chat_messages" ON live_chat_messages FOR SELECT USING (true);
CREATE POLICY "Public read live_stream_products" ON live_stream_products FOR SELECT USING (true);
CREATE POLICY "Public read customer_reviews" ON customer_reviews FOR SELECT USING (is_approved = true);
CREATE POLICY "Public read facebook_reviews" ON facebook_reviews FOR SELECT USING (true);
CREATE POLICY "Public read guestbook_entries" ON guestbook_entries FOR SELECT USING (status = 'approved');
CREATE POLICY "Public read guestbook_settings" ON guestbook_settings FOR SELECT USING (true);
CREATE POLICY "Public read news_categories" ON news_categories FOR SELECT USING (true);
CREATE POLICY "Public read news_posts" ON news_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Public read seo_metadata" ON seo_metadata FOR SELECT USING (true);
CREATE POLICY "Public read looks_bundles" ON looks_bundles FOR SELECT USING (is_active = true);
CREATE POLICY "Public read looks_bundle_products" ON looks_bundle_products FOR SELECT USING (true);
CREATE POLICY "Public read gift_thresholds" ON gift_thresholds FOR SELECT USING (is_active = true);
CREATE POLICY "Public read delivery_batches" ON delivery_batches FOR SELECT USING (is_active = true);
CREATE POLICY "Public read shipping_methods" ON shipping_methods FOR SELECT USING (is_active = true);
CREATE POLICY "Public read weekly_ambassadors" ON weekly_ambassadors FOR SELECT USING (true);

-- ============================================
-- 6. POLICIES RLS - USER OWN DATA
-- ============================================

-- user_profiles
CREATE POLICY "Users read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- addresses
CREATE POLICY "Users manage own addresses" ON addresses FOR ALL USING (auth.uid() = user_id);

-- orders
CREATE POLICY "Users read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages orders" ON orders FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- order_items
CREATE POLICY "Users read own order_items" ON order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));

-- order_invoices
CREATE POLICY "Users read own invoices" ON order_invoices FOR SELECT
  USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_invoices.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Service role manages invoices" ON order_invoices FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- wishlist_items
CREATE POLICY "Users manage own wishlist" ON wishlist_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Anon read wishlist" ON wishlist_items FOR SELECT USING (true);

-- cart_items
CREATE POLICY "Users manage own cart" ON cart_items FOR ALL USING (auth.uid() = user_id OR session_id IS NOT NULL);
CREATE POLICY "Anon manage cart by session" ON cart_items FOR ALL USING (session_id IS NOT NULL);

-- loyalty_points
CREATE POLICY "Users read own loyalty" ON loyalty_points FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages loyalty" ON loyalty_points FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- loyalty_transactions
CREATE POLICY "Users read own transactions" ON loyalty_transactions FOR SELECT USING (auth.uid() = user_id);

-- user_coupons
CREATE POLICY "Users read own coupons" ON user_coupons FOR SELECT USING (auth.uid() = user_id);

-- pending_prizes
CREATE POLICY "Users read own prizes" ON pending_prizes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own prizes" ON pending_prizes FOR UPDATE USING (auth.uid() = user_id);

-- analytics_sessions
CREATE POLICY "Anon insert sessions" ON analytics_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anon update sessions" ON analytics_sessions FOR UPDATE USING (true);
CREATE POLICY "Anon select sessions" ON analytics_sessions FOR SELECT USING (true);

-- page_visits
CREATE POLICY "Anon manage page_visits" ON page_visits FOR ALL USING (true);

-- cookie_consent_logs
CREATE POLICY "Anon insert consent" ON cookie_consent_logs FOR INSERT WITH CHECK (true);

-- contact_messages
CREATE POLICY "Anyone can send contact" ON contact_messages FOR INSERT WITH CHECK (true);

-- customer_reviews
CREATE POLICY "Users create own reviews" ON customer_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own reviews" ON customer_reviews FOR SELECT USING (auth.uid() = user_id);

-- guestbook_entries
CREATE POLICY "Users create guestbook" ON guestbook_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own guestbook" ON guestbook_entries FOR SELECT USING (auth.uid() = user_id OR status = 'approved');

-- guestbook_likes
CREATE POLICY "Anyone can like" ON guestbook_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone read likes" ON guestbook_likes FOR SELECT USING (true);
CREATE POLICY "Users delete own likes" ON guestbook_likes FOR DELETE USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- diamond_finds
CREATE POLICY "Users read own diamonds" ON diamond_finds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create diamonds" ON diamond_finds FOR INSERT WITH CHECK (auth.uid() = user_id);

-- referral_codes
CREATE POLICY "Users read own referral_code" ON referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Public read referral_codes" ON referral_codes FOR SELECT USING (true);

-- referrals
CREATE POLICY "Users read own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- birthday_vouchers
CREATE POLICY "Users read own vouchers" ON birthday_vouchers FOR SELECT USING (auth.uid() = user_id);

-- returns
CREATE POLICY "Users manage own returns" ON returns FOR ALL USING (auth.uid() = user_id);

-- return_items
CREATE POLICY "Users read return_items" ON return_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM returns WHERE returns.id = return_items.return_id AND returns.user_id = auth.uid()));

-- client_measurements
CREATE POLICY "Users manage own measurements" ON client_measurements FOR ALL USING (auth.uid() = user_id);

-- client_preferences
CREATE POLICY "Users manage own preferences" ON client_preferences FOR ALL USING (auth.uid() = user_id);

-- push_subscriptions
CREATE POLICY "Users manage own subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- newsletter_subscriptions
CREATE POLICY "Anyone can subscribe" ON newsletter_subscriptions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read newsletter" ON newsletter_subscriptions FOR SELECT USING (true);

-- product_availability_notifications
CREATE POLICY "Anyone can create notifications" ON product_availability_notifications FOR INSERT WITH CHECK (true);

-- woocommerce_cache
CREATE POLICY "Public read cache" ON woocommerce_cache FOR SELECT USING (true);
CREATE POLICY "Service role manages cache" ON woocommerce_cache FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 7. POLICIES RLS - ADMIN ACCESS
-- ============================================

-- Helper function to check admin access
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND admin_access = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies for all tables
CREATE POLICY "Admins full access user_profiles" ON user_profiles FOR ALL USING (is_admin());
CREATE POLICY "Admins full access addresses" ON addresses FOR ALL USING (is_admin());
CREATE POLICY "Admins full access orders" ON orders FOR ALL USING (is_admin());
CREATE POLICY "Admins full access order_items" ON order_items FOR ALL USING (is_admin());
CREATE POLICY "Admins full access order_invoices" ON order_invoices FOR ALL USING (is_admin());
CREATE POLICY "Admins full access loyalty_points" ON loyalty_points FOR ALL USING (is_admin());
CREATE POLICY "Admins full access loyalty_transactions" ON loyalty_transactions FOR ALL USING (is_admin());
CREATE POLICY "Admins full access loyalty_tiers" ON loyalty_tiers FOR ALL USING (is_admin());
CREATE POLICY "Admins full access coupon_types" ON coupon_types FOR ALL USING (is_admin());
CREATE POLICY "Admins full access user_coupons" ON user_coupons FOR ALL USING (is_admin());
CREATE POLICY "Admins full access home_slides" ON home_slides FOR ALL USING (is_admin());
CREATE POLICY "Admins full access featured_products" ON featured_products FOR ALL USING (is_admin());
CREATE POLICY "Admins full access home_categories" ON home_categories FOR ALL USING (is_admin());
CREATE POLICY "Admins full access scratch_game_settings" ON scratch_game_settings FOR ALL USING (is_admin());
CREATE POLICY "Admins full access scratch_game_prizes" ON scratch_game_prizes FOR ALL USING (is_admin());
CREATE POLICY "Admins full access wheel_game_settings" ON wheel_game_settings FOR ALL USING (is_admin());
CREATE POLICY "Admins full access wheel_game_prizes" ON wheel_game_prizes FOR ALL USING (is_admin());
CREATE POLICY "Admins full access pending_prizes" ON pending_prizes FOR ALL USING (is_admin());
CREATE POLICY "Admins full access live_streams" ON live_streams FOR ALL USING (is_admin());
CREATE POLICY "Admins full access live_chat_messages" ON live_chat_messages FOR ALL USING (is_admin());
CREATE POLICY "Admins full access live_stream_products" ON live_stream_products FOR ALL USING (is_admin());
CREATE POLICY "Admins full access analytics_sessions" ON analytics_sessions FOR ALL USING (is_admin());
CREATE POLICY "Admins full access page_visits" ON page_visits FOR ALL USING (is_admin());
CREATE POLICY "Admins full access contact_messages" ON contact_messages FOR ALL USING (is_admin());
CREATE POLICY "Admins full access customer_reviews" ON customer_reviews FOR ALL USING (is_admin());
CREATE POLICY "Admins full access facebook_reviews" ON facebook_reviews FOR ALL USING (is_admin());
CREATE POLICY "Admins full access guestbook_settings" ON guestbook_settings FOR ALL USING (is_admin());
CREATE POLICY "Admins full access guestbook_entries" ON guestbook_entries FOR ALL USING (is_admin());
CREATE POLICY "Admins full access guestbook_likes" ON guestbook_likes FOR ALL USING (is_admin());
CREATE POLICY "Admins full access news_categories" ON news_categories FOR ALL USING (is_admin());
CREATE POLICY "Admins full access news_posts" ON news_posts FOR ALL USING (is_admin());
CREATE POLICY "Admins full access seo_metadata" ON seo_metadata FOR ALL USING (is_admin());
CREATE POLICY "Admins full access diamond_finds" ON diamond_finds FOR ALL USING (is_admin());
CREATE POLICY "Admins full access referral_codes" ON referral_codes FOR ALL USING (is_admin());
CREATE POLICY "Admins full access referrals" ON referrals FOR ALL USING (is_admin());
CREATE POLICY "Admins full access birthday_vouchers" ON birthday_vouchers FOR ALL USING (is_admin());
CREATE POLICY "Admins full access weekly_ambassadors" ON weekly_ambassadors FOR ALL USING (is_admin());
CREATE POLICY "Admins full access looks_bundles" ON looks_bundles FOR ALL USING (is_admin());
CREATE POLICY "Admins full access looks_bundle_products" ON looks_bundle_products FOR ALL USING (is_admin());
CREATE POLICY "Admins full access gift_thresholds" ON gift_thresholds FOR ALL USING (is_admin());
CREATE POLICY "Admins full access push_subscriptions" ON push_subscriptions FOR ALL USING (is_admin());
CREATE POLICY "Admins full access push_notifications" ON push_notifications FOR ALL USING (is_admin());
CREATE POLICY "Admins full access returns" ON returns FOR ALL USING (is_admin());
CREATE POLICY "Admins full access return_items" ON return_items FOR ALL USING (is_admin());
CREATE POLICY "Admins full access delivery_batches" ON delivery_batches FOR ALL USING (is_admin());
CREATE POLICY "Admins full access shipping_methods" ON shipping_methods FOR ALL USING (is_admin());
CREATE POLICY "Admins full access client_measurements" ON client_measurements FOR ALL USING (is_admin());
CREATE POLICY "Admins full access client_preferences" ON client_preferences FOR ALL USING (is_admin());
CREATE POLICY "Admins full access product_availability_notifications" ON product_availability_notifications FOR ALL USING (is_admin());
CREATE POLICY "Admins full access newsletter_subscriptions" ON newsletter_subscriptions FOR ALL USING (is_admin());

-- ============================================
-- 8. STORAGE POLICIES
-- ============================================

-- Drop existing storage policies first
DROP POLICY IF EXISTS "Authenticated users upload order docs" ON storage.objects;
DROP POLICY IF EXISTS "Users read own order docs" ON storage.objects;
DROP POLICY IF EXISTS "Service role manages order docs" ON storage.objects;

CREATE POLICY "Authenticated users upload order docs" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'order-documents');

CREATE POLICY "Users read own order docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'order-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Service role manages order docs" ON storage.objects FOR ALL
  USING (bucket_id = 'order-documents' AND auth.jwt()->>'role' = 'service_role');

-- ============================================
-- 9. FUNCTIONS UTILES
-- ============================================

-- Function to award diamond reward
CREATE OR REPLACE FUNCTION award_diamond_reward(p_user_id uuid, p_product_id integer)
RETURNS void AS $$
DECLARE
  reward_amount decimal(10,2) := 0.10;
BEGIN
  -- Check if user already found this diamond
  IF EXISTS (
    SELECT 1 FROM diamond_finds
    WHERE user_id = p_user_id AND product_id = p_product_id
  ) THEN
    RETURN;
  END IF;

  -- Record the find
  INSERT INTO diamond_finds (user_id, product_id, reward_amount)
  VALUES (p_user_id, p_product_id, reward_amount);

  -- Update wallet balance
  UPDATE user_profiles
  SET wallet_balance = wallet_balance + reward_amount,
      updated_at = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to upsert user session
CREATE OR REPLACE FUNCTION upsert_user_session(
  p_session_id uuid,
  p_user_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session_id uuid;
BEGIN
  INSERT INTO user_sessions (session_id, user_id, started_at, last_activity_at)
  VALUES (p_session_id, p_user_id, now(), now())
  ON CONFLICT (session_id)
  DO UPDATE SET
    last_activity_at = now(),
    user_id = COALESCE(EXCLUDED.user_id, user_sessions.user_id)
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$;

-- Function to upsert analytics session
CREATE OR REPLACE FUNCTION upsert_analytics_session(
  p_session_id text,
  p_user_id uuid DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_ip_address inet DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_session_uuid uuid;
BEGIN
  INSERT INTO analytics_sessions (session_id, user_id, user_agent, ip_address)
  VALUES (p_session_id, p_user_id, p_user_agent, p_ip_address)
  ON CONFLICT (session_id)
  DO UPDATE SET
    last_activity = now(),
    user_id = COALESCE(EXCLUDED.user_id, analytics_sessions.user_id)
  RETURNING id INTO v_session_uuid;

  RETURN v_session_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user profile manually
CREATE OR REPLACE FUNCTION create_user_profile_manual(
  p_user_id uuid,
  p_email text,
  p_full_name text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Create profile
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (p_user_id, p_email, p_full_name)
  ON CONFLICT (id) DO NOTHING;

  -- Create loyalty record
  INSERT INTO loyalty_points (user_id, points)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Create referral code
  INSERT INTO referral_codes (user_id, code)
  VALUES (p_user_id, UPPER(SUBSTRING(MD5(p_user_id::text) FROM 1 FOR 8)))
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update guestbook likes count
CREATE OR REPLACE FUNCTION update_guestbook_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE guestbook_entries
    SET likes_count = likes_count + 1
    WHERE id = NEW.entry_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE guestbook_entries
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.entry_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for guestbook likes count
DROP TRIGGER IF EXISTS trigger_update_likes_count ON guestbook_likes;
CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON guestbook_likes
FOR EACH ROW
EXECUTE FUNCTION update_guestbook_likes_count();

-- Function to update total reviews count
CREATE OR REPLACE FUNCTION update_total_reviews_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE guestbook_settings
    SET total_reviews = (SELECT COUNT(*) FROM guestbook_entries WHERE status = 'approved'),
        updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for total reviews count
DROP TRIGGER IF EXISTS trigger_update_total_reviews ON guestbook_entries;
CREATE TRIGGER trigger_update_total_reviews
AFTER UPDATE ON guestbook_entries
FOR EACH ROW
EXECUTE FUNCTION update_total_reviews_count();

-- ============================================
-- 10. INDEXES DE PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_woocommerce_id ON orders(woocommerce_order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_product_id ON wishlist_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_session_id ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user_id ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_page_visits_session_id ON page_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_product_id ON customer_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_customer_reviews_user_id ON customer_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_news_posts_slug ON news_posts(slug);
CREATE INDEX IF NOT EXISTS idx_news_posts_category ON news_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_seo_metadata_entity ON seo_metadata(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_diamond_finds_user_product ON diamond_finds(user_id, product_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_user_id ON guestbook_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_order_id ON guestbook_entries(order_id);
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_status ON guestbook_entries(status);
CREATE INDEX IF NOT EXISTS idx_guestbook_entries_approved_at ON guestbook_entries(approved_at DESC) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_guestbook_likes_entry_id ON guestbook_likes(entry_id);

-- ============================================
-- 11. DONNÉES INITIALES
-- ============================================

-- Insert default loyalty tiers
INSERT INTO loyalty_tiers (name, points_required, discount_percentage, benefits, color) VALUES
  ('Bronze', 0, 0, ARRAY['Accès aux ventes privées'], '#CD7F32'),
  ('Argent', 500, 5, ARRAY['5% de réduction', 'Livraison prioritaire'], '#C0C0C0'),
  ('Or', 1500, 10, ARRAY['10% de réduction', 'Livraison gratuite', 'Avant-premières'], '#FFD700'),
  ('Platine', 3000, 15, ARRAY['15% de réduction', 'Cadeaux exclusifs', 'Service VIP'], '#E5E4E2')
ON CONFLICT DO NOTHING;

-- Insert default scratch game settings
INSERT INTO scratch_game_settings (is_active, max_plays_per_day)
VALUES (true, 1)
ON CONFLICT DO NOTHING;

-- Insert default wheel game settings
INSERT INTO wheel_game_settings (is_active, show_popup, max_plays_per_day)
VALUES (true, true, 1)
ON CONFLICT DO NOTHING;

-- Insert default guestbook settings
INSERT INTO guestbook_settings (requires_purchase, min_purchase_amount, auto_approve)
VALUES (false, 0, false)
ON CONFLICT DO NOTHING;

-- ============================================
-- 12. CRON JOB POUR CACHE CLEANUP
-- ============================================

-- Clean expired cache every hour
SELECT cron.schedule(
  'clean-expired-cache',
  '0 * * * *',
  $$DELETE FROM woocommerce_cache WHERE expires_at < now()$$
);

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'Migration complète terminée avec succès!' AS message;
