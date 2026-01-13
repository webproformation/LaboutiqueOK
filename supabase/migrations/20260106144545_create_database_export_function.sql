/*
  # Créer fonction RPC pour l'export de la base de données

  1. Nouvelle fonction
    - `get_database_export()` : Retourne un export JSON complet de toutes les tables principales
  
  2. Tables exportées
    - products : Tous les produits avec leurs détails
    - product_categories : Toutes les catégories
    - profiles : Profils utilisateurs (sans données sensibles)
    - orders : Commandes et leur statut
    - news : Actualités publiées
    - media : Bibliothèque média
    - coupons : Coupons actifs
    - featured_products : Produits mis en avant
    - home_slides : Slides page d'accueil
    - home_categories : Catégories page d'accueil
    - product_variations : Variations des produits
    - product_attributes : Attributs des produits
  
  3. Sécurité
    - Fonction accessible uniquement aux utilisateurs authentifiés
    - Les données sensibles (mots de passe, tokens) sont exclues
    - Limite de 10000 lignes par table pour éviter les surcharges

  4. Utilisation
    - Appelée via `supabase.rpc('get_database_export')`
    - Retourne un objet JSON avec toutes les données structurées
*/

-- Créer la fonction d'export de base de données
CREATE OR REPLACE FUNCTION get_database_export()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  export_data jsonb := '{}';
  table_data jsonb;
BEGIN
  -- Export products
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (
    SELECT *
    FROM products
    ORDER BY created_at DESC
    LIMIT 10000
  ) t;
  export_data := jsonb_set(export_data, '{products}', COALESCE(table_data, '[]'::jsonb));

  -- Export product_categories
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (
    SELECT *
    FROM product_categories
    ORDER BY display_order, name
    LIMIT 10000
  ) t;
  export_data := jsonb_set(export_data, '{product_categories}', COALESCE(table_data, '[]'::jsonb));

  -- Export profiles (sans données sensibles)
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (
    SELECT id, email, first_name, last_name, wallet_balance, loyalty_points, is_admin, created_at, updated_at
    FROM profiles
    ORDER BY created_at DESC
    LIMIT 10000
  ) t;
  export_data := jsonb_set(export_data, '{profiles}', COALESCE(table_data, '[]'::jsonb));

  -- Export orders
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (
    SELECT *
    FROM orders
    ORDER BY created_at DESC
    LIMIT 10000
  ) t;
  export_data := jsonb_set(export_data, '{orders}', COALESCE(table_data, '[]'::jsonb));

  -- Export news
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (
    SELECT *
    FROM news
    ORDER BY created_at DESC
    LIMIT 10000
  ) t;
  export_data := jsonb_set(export_data, '{news}', COALESCE(table_data, '[]'::jsonb));

  -- Export media
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (
    SELECT *
    FROM media
    ORDER BY created_at DESC
    LIMIT 10000
  ) t;
  export_data := jsonb_set(export_data, '{media}', COALESCE(table_data, '[]'::jsonb));

  -- Export coupons
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (
    SELECT *
    FROM coupons
    ORDER BY created_at DESC
    LIMIT 10000
  ) t;
  export_data := jsonb_set(export_data, '{coupons}', COALESCE(table_data, '[]'::jsonb));

  -- Export featured_products
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (
    SELECT *
    FROM featured_products
    ORDER BY display_order
    LIMIT 10000
  ) t;
  export_data := jsonb_set(export_data, '{featured_products}', COALESCE(table_data, '[]'::jsonb));

  -- Export home_slides
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (
    SELECT *
    FROM home_slides
    ORDER BY display_order
    LIMIT 10000
  ) t;
  export_data := jsonb_set(export_data, '{home_slides}', COALESCE(table_data, '[]'::jsonb));

  -- Export home_categories
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (
    SELECT *
    FROM home_categories
    ORDER BY display_order
    LIMIT 10000
  ) t;
  export_data := jsonb_set(export_data, '{home_categories}', COALESCE(table_data, '[]'::jsonb));

  -- Export product_variations
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (
    SELECT *
    FROM product_variations
    ORDER BY created_at DESC
    LIMIT 10000
  ) t;
  export_data := jsonb_set(export_data, '{product_variations}', COALESCE(table_data, '[]'::jsonb));

  -- Export product_attributes
  SELECT jsonb_agg(row_to_json(t))
  INTO table_data
  FROM (
    SELECT *
    FROM product_attributes
    ORDER BY created_at DESC
    LIMIT 10000
  ) t;
  export_data := jsonb_set(export_data, '{product_attributes}', COALESCE(table_data, '[]'::jsonb));

  -- Ajouter métadonnées
  export_data := jsonb_set(export_data, '{_metadata}', jsonb_build_object(
    'export_date', now(),
    'database_version', '1.0',
    'project', 'qcqbtmvbvipsxwjlgjvk'
  ));

  RETURN export_data;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_database_export() TO authenticated;

-- Commentaire
COMMENT ON FUNCTION get_database_export() IS 'Exporte toutes les données principales de la base en JSON pour sauvegarde';
