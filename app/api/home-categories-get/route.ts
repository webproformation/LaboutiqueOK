import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const active = url.searchParams.get('active') === 'true';

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Home Categories API] Missing Supabase configuration');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    let query = supabase
      .from('home_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (active) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Home Categories API] Error fetching:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      // Return empty array instead of 500 to prevent frontend crash
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('[Home Categories API] Unexpected error:', {
      message: error?.message,
      stack: error?.stack
    });
    // Return empty array instead of 500 to prevent frontend crash
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, categoryData, categoryId } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    if (action === 'create') {
      const { data, error } = await supabase
        .from('home_categories')
        .insert(categoryData)
        .select()
        .single();

      if (error) {
        console.error('[Home Categories API] Error creating:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Call webhook revalidator to clear PostgREST cache
      try {
        await fetch('https://qcqbtmvbvipsxwjlgjvk.supabase.co/functions/v1/webhook-revalidator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ table: 'home_categories', action: 'INSERT' })
        });
      } catch (webhookError) {
        console.error('[Home Categories API] Webhook error (non-fatal):', webhookError);
      }

      return NextResponse.json(data);
    }

    if (action === 'update') {
      if (!categoryId) {
        return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('home_categories')
        .update(categoryData)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        console.error('[Home Categories API] Error updating:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    }

    if (action === 'delete') {
      if (!categoryId) {
        return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('home_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        console.error('[Home Categories API] Error deleting:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('[Home Categories API] Unexpected error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
