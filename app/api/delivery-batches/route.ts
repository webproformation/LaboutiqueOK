import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-service';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthenticatedUserId(request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const action = searchParams.get('action');

    if (action === 'active') {
      const { data, error } = await supabaseService
        .from('delivery_batches')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching active delivery batches:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ batches: data || [] });
    }

    if (!userId) {
      return NextResponse.json({ batches: [] });
    }

    const query = supabaseService
      .from('delivery_batches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching delivery batches:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ batches: data || [] });
  } catch (error: any) {
    console.error('Error in delivery-batches GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
