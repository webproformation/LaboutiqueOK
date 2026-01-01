import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // PRIORITE 1: Variables BYPASS_ (nouveau projet qcqbtmv)
  // PRIORITE 2: Variables NEXT_PUBLIC_ (ancien projet - fallback)
  const supabaseUrl =
    process.env.BYPASS_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.BYPASS_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing Supabase environment variables!');
    console.error('BYPASS_SUPABASE_URL:', process.env.BYPASS_SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.error('BYPASS_SUPABASE_ANON_KEY:', process.env.BYPASS_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set (fallback)' : '❌ Missing');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set (fallback)' : '❌ Missing');
    throw new Error('Supabase environment variables are required');
  }

  const usingBypass = !!process.env.BYPASS_SUPABASE_URL;
  console.log(
    usingBypass
      ? '✅ Supabase client initialized with BYPASS variables (project: qcqbtmv)'
      : '⚠️  Supabase client initialized with NEXT_PUBLIC variables (deprecated project)'
  );
  console.log('📍 URL:', supabaseUrl);

  supabaseInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
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
