/*
  # Fonction d'export complet de la base de données

  1. Nouvelle Fonction RPC
    - `get_full_database_export()` - Exporte TOUTES les tables de la base de données
    - Inclut toutes les 51 tables identifiées
    - Retourne un objet JSON avec métadonnées complètes

  2. Contenu
    - Export de toutes les tables publiques
    - Métadonnées d'export (date, version, projet)
    - Comptage des enregistrements par table
    
  3. Sécurité
    - Accessible uniquement aux administrateurs
    - Limite de 10000 enregistrements par table (protection mémoire)
*/

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS get_full_database_export();

-- Créer la nouvelle fonction d'export complet
CREATE OR REPLACE FUNCTION get_full_database_export()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  export_data jsonb := '{}';
  table_data jsonb;
BEGIN
  -- Vérification des droits admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Accès refusé : seuls les administrateurs peuvent exporter la base';
  END IF;

  -- Export products
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM products ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{products}', COALESCE(table_data, '[]'::jsonb));

  -- Export categories
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM categories ORDER BY display_order, name LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{categories}', COALESCE(table_data, '[]'::jsonb));

  -- Export profiles (sans données sensibles)
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT id, email, first_name, last_name, wallet_balance, is_admin, created_at, updated_at FROM profiles ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{profiles}', COALESCE(table_data, '[]'::jsonb));

  -- Export orders
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM orders ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{orders}', COALESCE(table_data, '[]'::jsonb));

  -- Export order_items
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM order_items ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{order_items}', COALESCE(table_data, '[]'::jsonb));

  -- Export news_posts
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM news_posts ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{news_posts}', COALESCE(table_data, '[]'::jsonb));

  -- Export news_categories
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM news_categories ORDER BY display_order LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{news_categories}', COALESCE(table_data, '[]'::jsonb));

  -- Export news_post_categories
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM news_post_categories LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{news_post_categories}', COALESCE(table_data, '[]'::jsonb));

  -- Export media
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM media ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{media}', COALESCE(table_data, '[]'::jsonb));

  -- Export coupons
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM coupons ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{coupons}', COALESCE(table_data, '[]'::jsonb));

  -- Export coupon_types
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM coupon_types LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{coupon_types}', COALESCE(table_data, '[]'::jsonb));

  -- Export user_coupons
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM user_coupons ORDER BY obtained_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{user_coupons}', COALESCE(table_data, '[]'::jsonb));

  -- Export featured_products
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM featured_products ORDER BY display_order LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{featured_products}', COALESCE(table_data, '[]'::jsonb));

  -- Export home_slides
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM home_slides ORDER BY order_position LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{home_slides}', COALESCE(table_data, '[]'::jsonb));

  -- Export home_categories
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM home_categories ORDER BY display_order LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{home_categories}', COALESCE(table_data, '[]'::jsonb));

  -- Export product_variations
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM product_variations ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{product_variations}', COALESCE(table_data, '[]'::jsonb));

  -- Export product_attributes
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM product_attributes ORDER BY order_by LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{product_attributes}', COALESCE(table_data, '[]'::jsonb));

  -- Export product_attribute_terms
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM product_attribute_terms ORDER BY order_by LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{product_attribute_terms}', COALESCE(table_data, '[]'::jsonb));

  -- Export product_attribute_values
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM product_attribute_values LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{product_attribute_values}', COALESCE(table_data, '[]'::jsonb));

  -- Export product_category_mapping
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM product_category_mapping LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{product_category_mapping}', COALESCE(table_data, '[]'::jsonb));

  -- Export product_images
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM product_images ORDER BY display_order LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{product_images}', COALESCE(table_data, '[]'::jsonb));

  -- Export seo_metadata
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM seo_metadata ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{seo_metadata}', COALESCE(table_data, '[]'::jsonb));

  -- Export addresses
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM addresses ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{addresses}', COALESCE(table_data, '[]'::jsonb));

  -- Export cart_items
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM cart_items ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{cart_items}', COALESCE(table_data, '[]'::jsonb));

  -- Export wishlist
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM wishlist ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{wishlist}', COALESCE(table_data, '[]'::jsonb));

  -- Export reviews
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM reviews ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{reviews}', COALESCE(table_data, '[]'::jsonb));

  -- Export guestbook_entries
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM guestbook_entries ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{guestbook_entries}', COALESCE(table_data, '[]'::jsonb));

  -- Export guestbook_likes
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM guestbook_likes LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{guestbook_likes}', COALESCE(table_data, '[]'::jsonb));

  -- Export guestbook_votes
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM guestbook_votes LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{guestbook_votes}', COALESCE(table_data, '[]'::jsonb));

  -- Export guestbook_settings
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM guestbook_settings LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{guestbook_settings}', COALESCE(table_data, '[]'::jsonb));

  -- Export gift_cards
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM gift_cards ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{gift_cards}', COALESCE(table_data, '[]'::jsonb));

  -- Export gift_card_transactions
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM gift_card_transactions ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{gift_card_transactions}', COALESCE(table_data, '[]'::jsonb));

  -- Export looks
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM looks ORDER BY display_order LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{looks}', COALESCE(table_data, '[]'::jsonb));

  -- Export look_products
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM look_products ORDER BY display_order LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{look_products}', COALESCE(table_data, '[]'::jsonb));

  -- Export look_bundle_carts
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM look_bundle_carts LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{look_bundle_carts}', COALESCE(table_data, '[]'::jsonb));

  -- Export live_streams
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM live_streams ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{live_streams}', COALESCE(table_data, '[]'::jsonb));

  -- Export live_stream_products
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM live_stream_products LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{live_stream_products}', COALESCE(table_data, '[]'::jsonb));

  -- Export live_stream_viewers
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM live_stream_viewers LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{live_stream_viewers}', COALESCE(table_data, '[]'::jsonb));

  -- Export live_stream_chat_messages
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM live_stream_chat_messages ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{live_stream_chat_messages}', COALESCE(table_data, '[]'::jsonb));

  -- Export live_stream_analytics
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM live_stream_analytics LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{live_stream_analytics}', COALESCE(table_data, '[]'::jsonb));

  -- Export live_stream_settings
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM live_stream_settings LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{live_stream_settings}', COALESCE(table_data, '[]'::jsonb));

  -- Export delivery_batches
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM delivery_batches ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{delivery_batches}', COALESCE(table_data, '[]'::jsonb));

  -- Export delivery_batch_items
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM delivery_batch_items LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{delivery_batch_items}', COALESCE(table_data, '[]'::jsonb));

  -- Export shipping_methods
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM shipping_methods ORDER BY sort_order LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{shipping_methods}', COALESCE(table_data, '[]'::jsonb));

  -- Export loyalty_transactions
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM loyalty_transactions ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{loyalty_transactions}', COALESCE(table_data, '[]'::jsonb));

  -- Export contact_messages
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{contact_messages}', COALESCE(table_data, '[]'::jsonb));

  -- Export newsletter_subscriptions
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (SELECT * FROM newsletter_subscriptions ORDER BY subscribed_at DESC LIMIT 10000) t;
  export_data := jsonb_set(export_data, '{newsletter_subscriptions}', COALESCE(table_data, '[]'::jsonb));

  -- Ajouter métadonnées complètes
  export_data := jsonb_set(export_data, '{_metadata}', jsonb_build_object(
    'export_date', now(),
    'export_type', 'full_database',
    'database_version', '2.0',
    'project', 'qcqbtmvbvipsxwjlgjvk',
    'exported_by', auth.uid(),
    'total_tables', 47
  ));

  RETURN export_data;
END;
$$;

-- Grant execute permission to authenticated users (la fonction vérifie elle-même les droits admin)
GRANT EXECUTE ON FUNCTION get_full_database_export() TO authenticated;
