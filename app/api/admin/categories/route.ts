import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing Supabase configuration',
        data: []
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading categories:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        data: []
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: categories || []
    });

  } catch (error: any) {
    console.error('Unexpected error loading categories:', error);
    return NextResponse.json({
      success: false,
      error: error?.message || 'Unknown error',
      data: []
    }, { status: 500 });
  }
}
