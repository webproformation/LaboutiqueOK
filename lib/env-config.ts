export function getSupabaseUrl(): string {
  return process.env.BYPASS_SUPABASE_URL || process.env.APP_DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

export function getSupabaseAnonKey(): string {
  return process.env.APP_DATABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

export function getSupabaseServiceKey(): string {
  return process.env.BYPASS_SUPABASE_SERVICE_ROLE || process.env.APP_DATABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function getSupabaseConfig() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const serviceKey = getSupabaseServiceKey();

  if (!url) {
    throw new Error('Missing APP_DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  }

  return {
    url,
    anonKey,
    serviceKey
  };
}
