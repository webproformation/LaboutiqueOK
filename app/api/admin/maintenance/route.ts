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

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[Maintenance API] Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await request.json();
    const { is_maintenance_mode, maintenance_message, maintenance_start, maintenance_end } = body;

    console.log('[Maintenance API] Received data:', { is_maintenance_mode, maintenance_message, maintenance_start, maintenance_end });

    const upsertData: any = {
      id: 'general',
      updated_at: new Date().toISOString()
    };

    if (typeof is_maintenance_mode !== 'undefined') {
      upsertData.is_maintenance_mode = Boolean(is_maintenance_mode);
    }

    if (maintenance_message !== undefined) {
      upsertData.maintenance_message = maintenance_message || 'Le site est actuellement en maintenance. Nous serons bientôt de retour.';
    }

    if (maintenance_start !== undefined && maintenance_start !== null && maintenance_start !== '') {
      try {
        const startDate = new Date(maintenance_start);
        if (!isNaN(startDate.getTime())) {
          upsertData.maintenance_start = startDate.toISOString();
        } else {
          upsertData.maintenance_start = null;
        }
      } catch (e) {
        console.error('[Maintenance API] Invalid start date:', maintenance_start);
        upsertData.maintenance_start = null;
      }
    } else {
      upsertData.maintenance_start = null;
    }

    if (maintenance_end !== undefined && maintenance_end !== null && maintenance_end !== '') {
      try {
        const endDate = new Date(maintenance_end);
        if (!isNaN(endDate.getTime())) {
          upsertData.maintenance_end = endDate.toISOString();
        } else {
          upsertData.maintenance_end = null;
        }
      } catch (e) {
        console.error('[Maintenance API] Invalid end date:', maintenance_end);
        upsertData.maintenance_end = null;
      }
    } else {
      upsertData.maintenance_end = null;
    }

    console.log('[Maintenance API] Upserting data:', upsertData);

    const { data, error } = await supabase
      .from('site_settings')
      .upsert(upsertData, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      console.error('[Maintenance API] Supabase error:', error);
      return NextResponse.json(
        {
          error: error.message,
          details: error.details || 'Aucun détail disponible',
          hint: error.hint || 'Aucune indication disponible'
        },
        { status: 500 }
      );
    }

    console.log('[Maintenance API] Success:', data);

    return NextResponse.json({ data, success: true });
  } catch (error: any) {
    console.error('[Maintenance API] Unexpected error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Erreur inconnue',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
