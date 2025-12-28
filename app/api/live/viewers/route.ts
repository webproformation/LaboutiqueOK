import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();

    const sessionId = body.session_id || `anon_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const { data: viewer, error } = await supabase
      .from('live_stream_viewers')
      .insert({
        live_stream_id: body.live_stream_id,
        user_id: user?.id || null,
        session_id: sessionId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: streamData } = await supabase
      .from('live_streams')
      .select('current_viewers, total_views')
      .eq('id', body.live_stream_id)
      .maybeSingle();

    if (streamData) {
      await supabase
        .from('live_streams')
        .update({
          current_viewers: (streamData.current_viewers || 0) + 1,
          total_views: (streamData.total_views || 0) + 1
        })
        .eq('id', body.live_stream_id);
    }

    return NextResponse.json({ viewer, session_id: sessionId }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    const { error } = await supabase
      .from('live_stream_viewers')
      .update({
        left_at: new Date().toISOString(),
      })
      .eq('session_id', body.session_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: stream } = await supabase
      .from('live_streams')
      .select('current_viewers')
      .eq('id', body.live_stream_id)
      .single();

    if (stream && stream.current_viewers > 0) {
      await supabase
        .from('live_streams')
        .update({ current_viewers: stream.current_viewers - 1 })
        .eq('id', body.live_stream_id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
