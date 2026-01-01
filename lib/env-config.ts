// PRIORITE 1: Variables BYPASS_ (nouveau projet qcqbtmv)
// PRIORITE 2: Variables legacy (ancien projet - fallback)

export function getSupabaseUrl(): string {
  return process.env.BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
}

export function getSupabaseAnonKey(): string {
  return process.env.BYPASS_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
}

export function getSupabaseServiceKey(): string {
  return process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function getSupabaseConfig() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const serviceKey = getSupabaseServiceKey();

  if (!url) {
    console.error('❌ Missing BYPASS_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
    throw new Error('Missing Supabase URL');
  }

  const usingBypass = !!process.env.BYPASS_SUPABASE_URL;
  console.log(
    usingBypass
      ? '✅ Config using BYPASS variables (project: qcqbtmv)'
      : '⚠️  Config using legacy variables (deprecated project)'
  );

  return {
    url,
    anonKey,
    serviceKey,
    usingBypass
  };
}
