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
    const userId = await getAuthenticatedUserId(request);

    if (!userId && !sessionId) {
      return NextResponse.json({ items: [] });
    }

    const query = supabaseService
      .from('wishlist_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query.eq('user_id', userId);
    } else if (sessionId) {
      query.eq('session_id', sessionId);
    }

    const { data, error } = await query;

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
    const userId = await getAuthenticatedUserId(request);
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'add': {
        const { product_id, session_id } = data;

        const wishlistItem: any = {
          product_id,
        };

        if (userId) {
          wishlistItem.user_id = userId;
          wishlistItem.session_id = null;
        } else {
          wishlistItem.session_id = session_id;
          wishlistItem.user_id = null;
        }

        const { data: item, error } = await supabaseService
          .from('wishlist_items')
          .insert(wishlistItem)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ item });
      }

      case 'remove': {
        const { product_id } = data;

        const query = supabaseService
          .from('wishlist_items')
          .delete()
          .eq('product_id', product_id);

        if (userId) {
          query.eq('user_id', userId);
        } else if (data.session_id) {
          query.eq('session_id', data.session_id);
        }

        const { error } = await query;

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      case 'migrate': {
        const { from_session_id, to_user_id } = data;

        const { error } = await supabaseService
          .from('wishlist_items')
          .update({ user_id: to_user_id, session_id: null })
          .eq('session_id', from_session_id);

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
