/*
  # Fonction pour ajouter un produit au live (bypass cache PostgREST)
  
  1. Problème
    - Le cache PostgREST ne reconnaît pas les colonnes product_name et product_image
    - Même avec SERVICE_ROLE_KEY
    
  2. Solution
    - Fonction PostgreSQL qui fait l'insertion directement
    - Retourne le produit inséré en JSON
    
  3. Paramètres
    - Tous les champs nécessaires pour live_shared_products
*/

CREATE OR REPLACE FUNCTION add_product_to_live(
  p_live_stream_id text,
  p_product_id text,
  p_live_product_id text,
  p_special_offer text,
  p_promo_price decimal,
  p_original_price decimal,
  p_live_sku text,
  p_product_name text DEFAULT NULL,
  p_product_image text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
  v_expires_at timestamptz;
BEGIN
  -- Calculer la date d'expiration (2 heures après maintenant)
  v_expires_at := NOW() + INTERVAL '2 hours';
  
  -- Insérer le produit
  INSERT INTO live_shared_products (
    live_stream_id,
    product_id,
    live_product_id,
    special_offer,
    promo_price,
    original_price,
    live_sku,
    is_published,
    expires_at,
    product_name,
    product_image
  ) VALUES (
    p_live_stream_id,
    p_product_id,
    p_live_product_id,
    p_special_offer,
    p_promo_price,
    p_original_price,
    p_live_sku,
    false,
    v_expires_at,
    p_product_name,
    p_product_image
  )
  RETURNING json_build_object(
    'id', id,
    'live_stream_id', live_stream_id,
    'product_id', product_id,
    'live_product_id', live_product_id,
    'special_offer', special_offer,
    'promo_price', promo_price,
    'original_price', original_price,
    'live_sku', live_sku,
    'is_published', is_published,
    'expires_at', expires_at,
    'product_name', product_name,
    'product_image', product_image,
    'shared_at', shared_at
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Autoriser l'exécution à tous les utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION add_product_to_live TO authenticated;
GRANT EXECUTE ON FUNCTION add_product_to_live TO anon;