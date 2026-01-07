/*
  # Fix Products ID Generation

  1. Changes
    - Create function to generate sequential text IDs for products
    - Add trigger to auto-generate product IDs on insert
    - Create function to auto-create user profiles on signup
    - Add trigger to auto-create profiles when user signs up

  2. Notes
    - Product IDs will be in format: "prod-XXXX" where XXXX is a sequential number
    - Profile creation is automatic and includes user metadata
*/

-- Function to generate sequential product IDs
CREATE OR REPLACE FUNCTION generate_product_id()
RETURNS TEXT AS $$
DECLARE
  max_id INTEGER;
  new_id TEXT;
BEGIN
  -- Get the highest numeric ID from existing products
  SELECT COALESCE(
    MAX(
      CASE 
        WHEN id ~ '^\d+$' THEN id::INTEGER
        ELSE 0
      END
    ), 
    0
  ) INTO max_id
  FROM products;
  
  -- Generate new ID
  new_id := (max_id + 1)::TEXT;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to set product ID before insert
CREATE OR REPLACE FUNCTION set_product_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set ID if not provided
  IF NEW.id IS NULL OR NEW.id = '' THEN
    NEW.id := generate_product_id();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS products_set_id ON products;
CREATE TRIGGER products_set_id
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION set_product_id();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    created_at,
    wallet_balance,
    is_admin,
    blocked,
    cancelled_orders_count
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    0,
    FALSE,
    FALSE,
    0
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users (if not exists)
DO $$
BEGIN
  -- Drop trigger if exists
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  
  -- Create trigger
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
