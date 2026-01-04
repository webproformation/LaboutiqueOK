import { createClient } from '@supabase/supabase-js';

// PRIORITE 1: Variables BYPASS_ (nouveau projet qcqbtmv)
// PRIORITE 2: Variables NEXT_PUBLIC_ (ancien projet - fallback)
const supabaseUrl =
  process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseServiceKey =
  process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

// Ne pas lancer d'erreur pendant le build Next.js
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || process.env.NODE_ENV === 'test';

if (!supabaseUrl && !isBuildTime) {
  console.error('❌ Missing NEXT_PUBLIC_BYPASS_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
  throw new Error('Missing Supabase URL');
}

if (!supabaseServiceKey && !isBuildTime) {
  console.error('❌ Missing BYPASS_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  throw new Error('Missing Supabase Service Role Key');
}

const usingBypass = !!process.env.NEXT_PUBLIC_BYPASS_SUPABASE_URL;
if (!isBuildTime) {
  console.log(
    usingBypass
      ? '✅ Service client initialized with BYPASS variables (project: qcqbtmv)'
      : '⚠️  Service client initialized with legacy variables (deprecated project)'
  );
  console.log('📍 Service URL:', supabaseUrl);
}

export const supabaseService = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
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
