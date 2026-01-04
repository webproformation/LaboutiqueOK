import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  product_id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  created_at: string;
};

export type HomeCategory = {
  id: string;
  category_id: string;
  display_order: number;
  is_featured: boolean;
  created_at: string;
  category?: ProductCategory;
};

export type Profile = {
  id: string;
  email: string;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
};

export type LoyaltyTier = {
  id: string;
  name: string;
  min_points: number;
  discount_percentage: number;
  created_at: string;
};
