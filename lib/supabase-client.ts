import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.BYPASS_SUPABASE_URL || process.env.APP_DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.APP_DATABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables!');
    console.error('BYPASS_SUPABASE_URL, APP_DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('APP_DATABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
    throw new Error('Supabase environment variables are required');
  }

  console.log('Supabase client initialized with URL:', supabaseUrl);
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
