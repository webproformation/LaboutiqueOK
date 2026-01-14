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
      expires_at,
      product_name,
      product_image
    } = body;

    if (!live_stream_id || !product_id || !promo_price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const insertQuery = `
      INSERT INTO live_shared_products (
        live_stream_id,
        product_id,
        live_product_id,
        special_offer,
        promo_price,
        original_price,
        live_sku,
        is_published,
        expires_at,
        product_name,
        product_image
      ) VALUES (
        '${live_stream_id}',
        '${product_id}',
        ${live_product_id ? `'${live_product_id}'` : 'NULL'},
        ${special_offer ? `'${special_offer.replace(/'/g, "''")}'` : 'NULL'},
        ${promo_price},
        ${original_price || 'NULL'},
        ${live_sku ? `'${live_sku}'` : 'NULL'},
        false,
        ${expires_at ? `'${expires_at}'` : 'NULL'},
        ${product_name ? `'${product_name.replace(/'/g, "''")}'` : 'NULL'},
        ${product_image ? `'${product_image}'` : 'NULL'}
      )
      RETURNING *;
    `;

    const { data, error } = await supabaseAdmin.rpc('execute_sql', {
      query: insertQuery
    });

    if (error) {
      console.error('Error inserting live product:', error);

      const { data: directInsert, error: directError } = await supabaseAdmin
        .from('live_shared_products')
        .insert({
          live_stream_id,
          product_id,
          live_product_id,
          special_offer,
          promo_price,
          original_price,
          live_sku,
          is_published: false,
          expires_at,
          product_name,
          product_image
        })
        .select();

      if (directError) {
        console.error('Direct insert also failed:', directError);
        return NextResponse.json(
          {
            error: directError.message,
            details: directError,
            sqlAttempt: error.message
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data: directInsert });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
