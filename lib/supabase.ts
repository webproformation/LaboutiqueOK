import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  regular_price: number | null;
  sale_price: number | null;
  stock_quantity: number | null;
  status: string;
  image_url: string | null;
  images: any;
  created_at: string;
  updated_at: string;
  is_featured?: boolean;
  is_diamond?: boolean;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  display_order: number;
  created_at: string;
};

export type ProductCategory = Category;

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  wallet_balance: number;
  created_at: string;
};
