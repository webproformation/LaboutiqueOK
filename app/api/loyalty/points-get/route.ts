import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');

    if (!userId) {
      console.error('[Loyalty Points API] Missing user_id parameter');
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Loyalty Points API] Missing Supabase configuration', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseServiceKey
      });
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('[Loyalty Points API] Fetching loyalty points for user:', userId);

    const { data, error } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[Loyalty Points API] Error fetching:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({
        error: error.message,
        details: error.details
      }, { status: 500 });
    }

    // If no loyalty points exist for this user, create them
    if (!data) {
      console.log('[Loyalty Points API] No loyalty points found, creating new record');

      const { data: newData, error: insertError } = await supabase
        .from('loyalty_points')
        .insert({
          user_id: userId,
          page_visit_points: 0,
          live_participation_count: 0,
          order_points: 0,
          live_share_points: 0,
          total_points: 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[Loyalty Points API] Error creating loyalty points:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });

        // Return default values if creation fails (shouldn't happen with permissive RLS)
        return NextResponse.json({
          user_id: userId,
          page_visit_points: 0,
          live_participation_count: 0,
          order_points: 0,
          live_share_points: 0,
          total_points: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      console.log('[Loyalty Points API] Successfully created loyalty points');
      return NextResponse.json(newData);
    }

    console.log('[Loyalty Points API] Successfully fetched loyalty points');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Loyalty Points API] Unexpected error:', {
      message: error?.message,
      stack: error?.stack
    });
    // Return default values instead of 500 to prevent frontend crash
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id') || 'unknown';
    return NextResponse.json({
      user_id: userId,
      page_visit_points: 0,
      live_participation_count: 0,
      order_points: 0,
      live_share_points: 0,
      total_points: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
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
