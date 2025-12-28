import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-client';
import { createServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const searchParams = request.nextUrl.searchParams;
    const streamId = searchParams.get('stream_id');

    if (!streamId) {
      return NextResponse.json(
        { error: 'stream_id is required' },
        { status: 400 }
      );
    }

    const { data: messages, error } = await supabase
      .from('live_stream_chat_messages')
      .select('*')
      .eq('live_stream_id', streamId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    const username = profile
      ? `${profile.first_name} ${profile.last_name}`.trim() || 'Utilisateur'
      : 'Utilisateur';

    const { data: message, error } = await supabase
      .from('live_stream_chat_messages')
      .insert({
        live_stream_id: body.live_stream_id,
        user_id: user.id,
        username,
        avatar_url: profile?.avatar_url || '',
        message: body.message,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
