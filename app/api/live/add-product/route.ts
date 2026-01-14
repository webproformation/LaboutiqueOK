import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      live_stream_id,
      product_id,
      live_product_id,
      special_offer,
      promo_price,
      original_price,
      live_sku,
      product_name,
      product_image
    } = body;

    if (!live_stream_id || !product_id || !promo_price) {
      return NextResponse.json(
        { error: 'Missing required fields: live_stream_id, product_id, promo_price' },
        { status: 400 }
      );
    }

    console.log('[API /live/add-product] Step 1: Insert with minimal data (cache workaround)...');

    const { data: insertedRow, error: insertError } = await supabaseAdmin
      .from('live_shared_products')
      .insert({
        live_stream_id,
        product_id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[API /live/add-product] Insert failed:', insertError);
      return NextResponse.json(
        {
          error: 'Failed to add product to live',
          message: insertError.message,
          details: insertError
        },
        { status: 500 }
      );
    }

    console.log('[API /live/add-product] Step 2: Update with full data...');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    const { data: updatedData, error: updateError } = await supabaseAdmin
      .from('live_shared_products')
      .update({
        live_product_id: live_product_id || null,
        promo_price: parseFloat(promo_price),
        original_price: original_price ? parseFloat(original_price) : null,
        live_sku: live_sku || null,
        is_published: false,
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', insertedRow.id)
      .select()
      .single();

    if (updateError) {
      console.error('[API /live/add-product] Update failed:', updateError);
    } else {
      console.log('[API /live/add-product] Success:', updatedData);
    }

    return NextResponse.json({
      success: true,
      data: updatedData || insertedRow
    });
  } catch (error: any) {
    console.error('[API /live/add-product] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
