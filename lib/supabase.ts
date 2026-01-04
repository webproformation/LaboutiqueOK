import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Product = {
  id: string;
  woocommerce_id: number;
  name: string;
  slug: string;
  price: number | null;
  description: string;
  image_url: string;
  stock: number;
  category_id: string | null;
  woocommerce_category_id: number | null;
  short_description: string;
  regular_price: number;
  sale_price: number | null;
  images: Array<{ src: string; alt: string }>;
  attributes: any[];
  stock_status: string;
  stock_quantity: number;
  weight: number | null;
  dimensions: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  manage_stock: boolean;
  featured: boolean;
  status: string;
  is_hidden_diamond: boolean;
  diamond_animation_type: string;
  is_featured: boolean;
  is_diamond: boolean;
  categories: any[];
};

export type Category = {
  id: string;
  woocommerce_id: number;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  woocommerce_parent_id: number | null;
  count: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  parent_id: string | null;
};

export type ProductCategory = Category;

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
