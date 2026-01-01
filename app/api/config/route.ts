import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    supabaseUrl: process.env.BYPASS_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.BYPASS_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    wordpressUrl: process.env.BYPASS_WORDPRESS_URL || process.env.WORDPRESS_URL,
    usingBypass: !!process.env.BYPASS_SUPABASE_URL,
  };

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.error('❌ Config API: Missing Supabase configuration');
    return NextResponse.json(
      { error: 'Missing Supabase configuration' },
      { status: 500 }
    );
  }

  console.log('✅ Config API called:', {
    supabaseUrl: config.supabaseUrl,
    usingBypass: config.usingBypass,
    hasAnonKey: !!config.supabaseAnonKey
  });

  return NextResponse.json(config);
}
