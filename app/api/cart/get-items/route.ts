import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: 'public' } }
    );

    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data || [], { status: 200 });
  } catch (error: any) {
    console.error('Error in get-cart-items:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: 'public' } }
    );

    switch (action) {
      case 'add': {
        const { user_id, product_id, variation_id, ...itemData } = data;

        const { error } = await supabase
          .from('cart_items')
          .upsert({
            user_id,
            product_id,
            variation_id,
            ...itemData
          }, {
            onConflict: 'user_id,product_id,variation_id',
            ignoreDuplicates: false
          });

        if (error) throw error;

        return NextResponse.json({ success: true }, { status: 200 });
      }

      case 'update': {
        const { id, ...updateData } = data;
        const { error } = await supabase
          .from('cart_items')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true }, { status: 200 });
      }

      case 'delete': {
        const { id } = data;
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true }, { status: 200 });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in cart items action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
