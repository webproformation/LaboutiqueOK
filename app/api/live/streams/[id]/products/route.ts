import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient();

    const { data: products, error } = await supabase
      .from('live_stream_products')
      .select('*')
      .eq('live_stream_id', id)
      .order('position', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (body.is_current) {
      await supabase
        .from('live_stream_products')
        .update({ is_current: false })
        .eq('live_stream_id', id);

      await supabase
        .from('live_streams')
        .update({ featured_product_id: body.product_id })
        .eq('id', id);
    }

    const { data: product, error } = await supabase
      .from('live_stream_products')
      .insert({
        live_stream_id: id,
        product_id: body.product_id,
        product_name: body.product_name,
        product_image: body.product_image,
        product_price: body.product_price,
        product_url: body.product_url,
        position: body.position || 0,
        is_current: body.is_current || false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
