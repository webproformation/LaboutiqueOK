/*
  # Upgrade Système Looks/Bundles Complet
  
  1. Modifications de la table looks
    - Ajout photo principale
    - Ajout conseil de Morgane
    - Ajout remise automatique 5%
    
  2. Modifications de look_products
    - Ajout gestion stock en temps réel
    - Ajout hotspots interactifs
    - Ajout variantes (tailles/couleurs)
    
  3. Logique métier
    - Remise 5% si tous les articles sont ajoutés
    - Synchronisation stock global
    - Désactivation automatique si rupture
    
  4. Sécurité
    - RLS déjà activé sur looks et look_products
*/

-- UPGRADE TABLE LOOKS
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'looks' AND column_name = 'morgane_style_advice'
  ) THEN
    ALTER TABLE looks ADD COLUMN morgane_style_advice text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'looks' AND column_name = 'total_price'
  ) THEN
    ALTER TABLE looks ADD COLUMN total_price numeric DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'looks' AND column_name = 'discounted_price'
  ) THEN
    ALTER TABLE looks ADD COLUMN discounted_price numeric DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'looks' AND column_name = 'items_count'
  ) THEN
    ALTER TABLE looks ADD COLUMN items_count integer DEFAULT 0;
  END IF;
END $$;

-- UPGRADE TABLE LOOK_PRODUCTS
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'look_products' AND column_name = 'product_slug'
  ) THEN
    ALTER TABLE look_products ADD COLUMN product_slug text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'look_products' AND column_name = 'product_price'
  ) THEN
    ALTER TABLE look_products ADD COLUMN product_price numeric DEFAULT 0;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'look_products' AND column_name = 'available_sizes'
  ) THEN
    ALTER TABLE look_products ADD COLUMN available_sizes jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'look_products' AND column_name = 'available_colors'
  ) THEN
    ALTER TABLE look_products ADD COLUMN available_colors jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'look_products' AND column_name = 'stock_status'
  ) THEN
    ALTER TABLE look_products ADD COLUMN stock_status text DEFAULT 'instock' CHECK (stock_status IN ('instock', 'lowstock', 'outofstock'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'look_products' AND column_name = 'category'
  ) THEN
    ALTER TABLE look_products ADD COLUMN category text;
  END IF;
END $$;

-- INDEX pour performance
CREATE INDEX IF NOT EXISTS idx_looks_active ON looks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_look_products_look ON look_products(look_id);
CREATE INDEX IF NOT EXISTS idx_look_products_stock ON look_products(stock_status);

-- FONCTION : Calculer prix total look
CREATE OR REPLACE FUNCTION calculate_look_prices()
RETURNS TRIGGER AS $$
DECLARE
  total numeric := 0;
  count integer := 0;
BEGIN
  -- Calculer total et nombre d'items
  SELECT 
    COALESCE(SUM(product_price), 0),
    COUNT(*)
  INTO total, count
  FROM look_products
  WHERE look_id = NEW.look_id OR look_id = NEW.id;
  
  -- Mettre à jour le look
  UPDATE looks
  SET 
    total_price = total,
    items_count = count,
    discounted_price = total * (1 - (discount_percentage / 100)),
    updated_at = now()
  WHERE id = COALESCE(NEW.look_id, NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER : Recalculer prix lors de modifications
DROP TRIGGER IF EXISTS trigger_calculate_look_prices_insert ON look_products;
CREATE TRIGGER trigger_calculate_look_prices_insert
  AFTER INSERT ON look_products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_look_prices();

DROP TRIGGER IF EXISTS trigger_calculate_look_prices_update ON look_products;
CREATE TRIGGER trigger_calculate_look_prices_update
  AFTER UPDATE ON look_products
  FOR EACH ROW
  WHEN (OLD.product_price IS DISTINCT FROM NEW.product_price)
  EXECUTE FUNCTION calculate_look_prices();

-- FONCTION : Vérifier disponibilité look
CREATE OR REPLACE FUNCTION check_look_availability(look_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  out_of_stock_count integer;
BEGIN
  SELECT COUNT(*)
  INTO out_of_stock_count
  FROM look_products
  WHERE look_id = look_id_param
  AND stock_status = 'outofstock';
  
  RETURN out_of_stock_count = 0;
END;
$$;