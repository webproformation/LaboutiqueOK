import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('[/api/invoices/debug] Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      urlValue: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
      serviceKeyValue: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 20)}...` : 'MISSING'
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Test table exists
    console.log('[/api/invoices/debug] Testing table access...');
    const { data, error, count } = await supabase
      .from('order_invoices')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[/api/invoices/debug] Table access error:', error);
      return NextResponse.json({
        error: 'Table access failed',
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      }, { status: 500 });
    }

    console.log('[/api/invoices/debug] Table access successful, count:', count);

    // Try to fetch actual data
    const { data: invoices, error: fetchError } = await supabase
      .from('order_invoices')
      .select('*')
      .limit(5);

    if (fetchError) {
      console.error('[/api/invoices/debug] Fetch error:', fetchError);
      return NextResponse.json({
        error: 'Fetch failed',
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        code: fetchError.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tableExists: true,
      count,
      sampleInvoices: Array.isArray(invoices) ? invoices.map(inv => ({
        id: inv.id,
        invoice_number: inv.invoice_number,
        order_number: inv.order_number
      })) : []
    });

  } catch (error: any) {
    console.error('[/api/invoices/debug] Exception:', error);
    return NextResponse.json({
      error: 'Exception occurred',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
