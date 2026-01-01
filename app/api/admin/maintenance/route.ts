import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'general')
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await request.json();
    const { is_maintenance_mode, maintenance_message, maintenance_start, maintenance_end } = body;

    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (typeof is_maintenance_mode !== 'undefined') {
      updates.is_maintenance_mode = is_maintenance_mode;
    }

    if (maintenance_message !== undefined) {
      updates.maintenance_message = maintenance_message;
    }

    if (maintenance_start !== undefined) {
      updates.maintenance_start = maintenance_start;
    }

    if (maintenance_end !== undefined) {
      updates.maintenance_end = maintenance_end;
    }

    const { data, error } = await supabase
      .from('site_settings')
      .update(updates)
      .eq('id', 'general')
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
