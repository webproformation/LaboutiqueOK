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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    let userId: string | undefined;
    try {
      userId = await getAuthenticatedUserId(request);
    } catch (error) {
      console.log('User not authenticated, continuing as anonymous');
    }

    switch (action) {
      case 'track_page_visit': {
        const { path, session_id } = data;

        if (!session_id || !path) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Use RPC function to bypass PostgREST cache issues
        const { data: result, error } = await supabaseService.rpc('analytics_track_page_visit', {
          p_session_id: session_id,
          p_user_id: userId || null,
          p_page_path: path
        });

        if (error) {
          console.error('Error tracking page visit:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      case 'upsert_session': {
        const { session_id, last_activity } = data;

        if (!session_id) {
          return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
        }

        // Use RPC function to bypass PostgREST cache issues
        const { data: result, error } = await supabaseService.rpc('analytics_upsert_session', {
          p_session_id: session_id,
          p_user_id: userId || null,
          p_last_activity: last_activity || new Date().toISOString()
        });

        if (error) {
          console.error('Error upserting session:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in analytics POST:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error',
      success: false
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'page_visits': {
        const { data, error } = await supabaseService
          .from('page_visits')
          .select('*')
          .order('visited_at', { ascending: false })
          .limit(100);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ visits: data || [] });
      }

      case 'user_sessions': {
        const { data, error } = await supabaseService
          .from('user_sessions')
          .select('*')
          .order('last_activity_at', { ascending: false })
          .limit(100);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ sessions: data || [] });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in analytics GET:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error',
      success: false
    }, { status: 500 });
  }
}
