import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const action = searchParams.get('action');
    const userId = searchParams.get('user_id');

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: 'public' } }
    );

    if (action === 'active') {
      const { data, error } = await supabase
        .from('delivery_batches')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json(data || [], { status: 200 });
    }

    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    let query = supabase
      .from('delivery_batches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data || [], { status: 200 });
  } catch (error: any) {
    console.error('Error in get-delivery-batches:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
