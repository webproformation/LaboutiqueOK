import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ⚠️ VERROUILLAGE ANTI-REVERT - NE PAS MODIFIER
// Projet: qcqbtmvbvipsxwjlgjvk.supabase.co
// Les IDs produits sont en TEXT (héritage: "571", "102", etc.)
// INTERDICTION de revenir à un autre projet ou d'utiliser process.env sans failsafe
const LOCKED_SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const LOCKED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c';

// Failsafe: utilise TOUJOURS les credentials hardcodés
const supabaseUrl = LOCKED_SUPABASE_URL;
const supabaseAnonKey = LOCKED_SUPABASE_ANON_KEY;

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  regular_price: number | null;
  sale_price: number | null;
  stock_quantity: number | null;
  stock_status: string;
  status: string;
  type: string;
  image_url: string | null;
  images: any;
  attributes: any;
  variations: any;
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
  meta_title: string | null;
  meta_description: string | null;
  seo_keywords: string | null;
  is_visible: boolean;
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
