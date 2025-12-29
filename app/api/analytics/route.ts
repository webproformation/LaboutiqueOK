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
    const userId = await getAuthenticatedUserId(request);
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'track_page_visit': {
        const { path, session_id } = data;

        const visitData: any = {
          page_path: path,
          visited_at: new Date().toISOString(),
        };

        if (userId) {
          visitData.user_id = userId;
        } else {
          visitData.session_id = session_id;
        }

        const { error } = await supabaseService
          .from('page_visits')
          .insert(visitData);

        if (error) {
          console.error('Error tracking page visit:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      case 'upsert_session': {
        const { session_id, last_activity, device_info, visitor_id } = data;

        const sessionData: any = {
          session_id,
          last_activity,
          visitor_id: visitor_id || null,
        };

        if (userId) {
          sessionData.user_id = userId;
        }

        if (device_info) {
          sessionData.device_info = device_info;
        }

        const { data: existingSession } = await supabaseService
          .from('user_sessions')
          .select('*')
          .eq('session_id', session_id)
          .maybeSingle();

        if (existingSession) {
          const { error } = await supabaseService
            .from('user_sessions')
            .update({
              last_activity,
              user_id: userId || existingSession.user_id,
            })
            .eq('session_id', session_id);

          if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
        } else {
          const { error } = await supabaseService
            .from('user_sessions')
            .insert(sessionData);

          if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
          }
        }

        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in analytics POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
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
          .order('last_activity', { ascending: false })
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
