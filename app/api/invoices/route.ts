import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const orderNumber = searchParams.get('orderNumber');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[/api/invoices] Missing Supabase configuration');
      return NextResponse.json({ error: 'Configuration serveur manquante', invoices: [] }, { status: 500 });
    }

    // Service role client bypasses RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('[/api/invoices] Building query with filters:', { orderId, orderNumber });

    let query = supabase.from('order_invoices').select('*');

    if (orderId) {
      query = query.eq('woocommerce_order_id', parseInt(orderId));
    } else if (orderNumber) {
      query = query.eq('order_number', orderNumber);
    } else {
      // No filters, return all invoices (admin view)
      query = query.order('created_at', { ascending: false });
    }

    console.log('[/api/invoices] Executing query...');
    const { data, error } = await query;

    if (error) {
      console.error('[/api/invoices] Database error:', error);
      console.error('[/api/invoices] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({
        error: `Erreur de base de données: ${error.message}`,
        details: error.details,
        code: error.code,
        invoices: []
      }, { status: 500 });
    }

    console.log('[/api/invoices] Successfully fetched', data?.length || 0, 'invoices');
    return NextResponse.json({ invoices: data || [] });
  } catch (error: any) {
    console.error('[/api/invoices] Caught exception:', error);
    console.error('[/api/invoices] Error stack:', error.stack);
    return NextResponse.json({
      error: `Erreur serveur: ${error.message}`,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      invoices: []
    }, { status: 500 });
  }
}
