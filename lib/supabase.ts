import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// ⚠️ VERROUILLAGE ANTI-REVERT - NE PAS MODIFIER
// Projet: qcqbtmvbvipsxwjlgjvk.supabase.co
// Les IDs produits sont en TEXT (héritage: "571", "102", etc.)
// INTERDICTION de revenir à un autre projet ou d'utiliser process.env sans failsafe
const LOCKED_SUPABASE_URL = 'https://qcqbtmvbvipsxwjlgjvk.supabase.co';
const LOCKED_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWJ0bXZidmlwc3h3amxnanZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MzIzNjAsImV4cCI6MjA4MjUwODM2MH0.q-4uGaHsuojj3ejo5IG4V-z2fx-ER9grHsRzYNkYn0c';

// 🛡️ PROTECTION DE SÉCURITÉ - Vérification au démarrage
if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!envUrl.includes('qcqbtmvbvipsxwjlgjvk')) {
    throw new Error(
      `🚨 ERREUR DE SÉCURITÉ: Tentative d'utilisation d'un projet non autorisé.\n` +
      `URL détectée: ${envUrl}\n` +
      `Seul le projet qcqbtmvbvipsxwjlgjvk est autorisé.\n` +
      `INTERDICTION FORMELLE de revenir sur mcstv ou tout autre projet.`
    );
  }
}

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseInstance(): SupabaseClient {
  if (!supabaseInstance) {
    // Double vérification de sécurité
    if (!LOCKED_SUPABASE_URL.includes('qcqbtmvbvipsxwjlgjvk')) {
      throw new Error('🚨 ERREUR CRITIQUE: URL Supabase corrompue détectée');
    }

    supabaseInstance = createSupabaseClient(LOCKED_SUPABASE_URL, LOCKED_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    });
  }
  return supabaseInstance;
}

export const supabase = getSupabaseInstance();

export function createClient() {
  return getSupabaseInstance();
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
  gallery_images?: string[] | null;
  images: any;
  attributes: any;
  variations: any;
  created_at: string;
  updated_at: string;
  is_featured?: boolean;
  is_diamond?: boolean;
  is_variable_product?: boolean;
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
  first_name: string | null;
  last_name: string | null;
  wallet_balance: number;
  loyalty_points: number;
  loyalty_euros: number;
  created_at: string;
  is_admin?: boolean;
};

export type OpenPackage = {
  id: string;
  user_id: string;
  status: 'active' | 'closed' | 'ready_to_prepare' | 'shipped';
  shipping_cost_paid: boolean;
  opened_at: string;
  closes_at: string;
  ready_at: string | null;
  shipped_at: string | null;
  final_weight: number | null;
  tracking_number: string | null;
  shipping_label_url: string | null;
  created_at: string;
  updated_at: string;
};
