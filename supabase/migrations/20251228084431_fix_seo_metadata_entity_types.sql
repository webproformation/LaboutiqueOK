/*
  # Fix SEO Metadata Entity Types

  1. Changes
    - Drop the old check constraint on entity_type
    - Add new check constraint that includes 'product_category' and other useful types
    - This allows SEO metadata for WooCommerce product categories

  2. Allowed entity types after this migration:
    - 'page' - Static pages
    - 'category' - Generic categories
    - 'product_category' - WooCommerce product categories
    - 'post' - Blog posts/articles
    - 'product' - Individual products (for future use)
*/

-- Drop the old constraint
ALTER TABLE seo_metadata DROP CONSTRAINT IF EXISTS seo_metadata_entity_type_check;

-- Add new constraint with more entity types
ALTER TABLE seo_metadata 
  ADD CONSTRAINT seo_metadata_entity_type_check 
  CHECK (entity_type IN ('page', 'category', 'product_category', 'post', 'product'));
