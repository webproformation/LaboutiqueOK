import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json([], { status: 200 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error: any) {
    console.error('Error in get-cart-items:', error);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
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

        if (error) {
          console.error('Add cart error:', error);
        }

        return NextResponse.json({ success: true }, { status: 200 });
      }

      case 'update': {
        const { id, ...updateData } = data;
        const { error } = await supabase
          .from('cart_items')
          .update(updateData)
          .eq('id', id);

        if (error) {
          console.error('Update cart error:', error);
        }

        return NextResponse.json({ success: true }, { status: 200 });
      }

      case 'delete': {
        const { id } = data;
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Delete cart error:', error);
        }

        return NextResponse.json({ success: true }, { status: 200 });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in cart items action:', error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
