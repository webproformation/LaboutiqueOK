import { createClient } from '@supabase/supabase-js';

// PRIORITE 1: Variables BYPASS_ (nouveau projet qcqbtmv)
// PRIORITE 2: Variables legacy (ancien projet - fallback)
const supabaseUrl =
  process.env.BYPASS_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceKey =
  process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing BYPASS_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  throw new Error('Missing Supabase URL');
}

if (!supabaseServiceKey) {
  console.error('❌ Missing BYPASS_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  throw new Error('Missing Supabase Service Role Key');
}

const usingBypass = !!process.env.BYPASS_SUPABASE_URL;
console.log(
  usingBypass
    ? '✅ Service client initialized with BYPASS variables (project: qcqbtmv)'
    : '⚠️  Service client initialized with legacy variables (deprecated project)'
);
console.log('📍 Service URL:', supabaseUrl);

export const supabaseService = createClient(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

export type Database = any;
