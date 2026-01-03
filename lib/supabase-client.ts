import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // PRIORITE 1: Variables BYPASS_ (nouveau projet qcqbtmv)
  // PRIORITE 2: Variables NEXT_PUBLIC_ (ancien projet - fallback)
  const supabaseUrl =
    process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_BYPASS_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Ne pas lancer d'erreur pendant le build Next.js
  const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || typeof window === 'undefined' && process.env.NODE_ENV === 'test';

  if (!supabaseUrl || !supabaseAnonKey) {
    if (!isBuildTime) {
      console.error('❌ Missing Supabase environment variables!');
      console.error('NEXT_PUBLIC_BYPASS_SUPABASE_URL:', process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL ? '✅ Set' : '❌ Missing');
      console.error('NEXT_PUBLIC_BYPASS_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_BYPASS_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set (fallback)' : '❌ Missing');
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set (fallback)' : '❌ Missing');
      throw new Error('Supabase environment variables are required');
    }
  }

  const usingBypass = !!process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL;
  if (!isBuildTime) {
    console.log(
      usingBypass
        ? '✅ Supabase client initialized with BYPASS variables (project: qcqbtmvbvipsxwjlgjvk)'
        : '⚠️  Supabase client initialized with NEXT_PUBLIC variables (deprecated project hondlefoprhtrpxnumyj)'
    );
    console.log('📍 Project ID:', supabaseUrl?.includes('qcqbtmv') ? 'qcqbtmvbvipsxwjlgjvk ✅' : 'WRONG PROJECT ❌');
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
