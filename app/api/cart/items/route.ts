import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ items: [] });
    }

    const { data, error } = await supabaseService
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching cart items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error in cart items GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'add': {
        const { user_id, product_id, variation_id, ...itemData } = data;

        // Use upsert to handle duplicates
        const { error } = await supabaseService
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
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      case 'update': {
        const { id, ...updateData } = data;
        const { error } = await supabaseService
          .from('cart_items')
          .update(updateData)
          .eq('id', id);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      case 'delete': {
        const { id } = data;
        const { error } = await supabaseService
          .from('cart_items')
          .delete()
          .eq('id', id);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in cart items POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
