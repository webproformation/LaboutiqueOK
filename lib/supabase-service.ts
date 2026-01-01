import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.BYPASS_SUPABASE_URL || process.env.APP_DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE || process.env.APP_DATABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing APP_DATABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
}

if (!supabaseServiceKey) {
  throw new Error('Missing APP_DATABASE_SERVICE_ROLE or SUPABASE_SERVICE_ROLE_KEY');
}

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
