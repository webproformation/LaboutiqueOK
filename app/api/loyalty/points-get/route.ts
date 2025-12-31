import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Loyalty Points API] Missing Supabase configuration');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data, error } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Loyalty Points API] Error fetching:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Loyalty Points API] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, userId, loyaltyData } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    if (action === 'create') {
      if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('loyalty_points')
        .insert({
          user_id: userId,
          page_visit_points: 0,
          live_participation_count: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('[Loyalty Points API] Error creating:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    if (action === 'update') {
      if (!userId) {
        return NextResponse.json({ error: 'userId is required' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('loyalty_points')
        .update(loyaltyData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('[Loyalty Points API] Error updating:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Loyalty Points API] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
