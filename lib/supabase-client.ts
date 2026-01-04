import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // UTILISATION EXCLUSIVE DES VARIABLES BYPASS (projet qcqbtmvbvipsxwjlgjvk)
  const supabaseUrl = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_BYPASS_SUPABASE_ANON_KEY;

  // Ne pas lancer d'erreur pendant le build Next.js
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || typeof window === 'undefined' && process.env.NODE_ENV === 'test';

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!isBuildTime) {
      console.error('❌ SUPABASE CONFIGURATION ERROR - MISSING BYPASS VARIABLES');
      console.error('NEXT_PUBLIC_BYPASS_SUPABASE_URL:', supabaseUrl || 'MISSING');
      console.error('NEXT_PUBLIC_BYPASS_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
      throw new Error('BYPASS Supabase variables are required for project qcqbtmvbvipsxwjlgjvk');
    }
  }

  if (!isBuildTime) {
    console.log('✅ SUPABASE CLIENT: qcqbtmvbvipsxwjlgjvk.supabase.co');
    console.log('📍 URL:', supabaseUrl);
  }

  supabaseInstance = createSupabaseClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key',
    {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'supabase.auth.token',
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web',
      },
    },
  });
  return supabaseInstance;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    const client = getSupabaseClient();
    return (client as any)[prop];
  }
});

export function createClient() {
  return getSupabaseClient();
}
