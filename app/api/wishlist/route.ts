import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-service';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthenticatedUserId(request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}
      }
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ items: [] });
    }

    const { data, error } = await supabaseService
      .from('wishlist_items')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching wishlist items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (error: any) {
    console.error('Error in wishlist GET:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'add': {
        const { product_slug, product_name, product_image, product_price, session_id } = data;

        const wishlistItem = {
          session_id,
          product_slug,
          product_name,
          product_image: product_image || null,
          product_price: product_price || null,
        };

        const { data: item, error } = await supabaseService
          .from('wishlist_items')
          .insert(wishlistItem)
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            return NextResponse.json({ error: 'Item already in wishlist' }, { status: 409 });
          }
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ item });
      }

      case 'remove': {
        const { product_slug, session_id } = data;

        const { error } = await supabaseService
          .from('wishlist_items')
          .delete()
          .eq('session_id', session_id)
          .eq('product_slug', product_slug);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in wishlist POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
