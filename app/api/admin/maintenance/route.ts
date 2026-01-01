import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.BYPASS_SUPABASE_URL || process.env.APP_DATABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE || process.env.APP_DATABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
    console.log('[Maintenance API] ===== DEBUT REQUETE =====');
    console.log('[Maintenance API] BYPASS_SUPABASE_URL:', process.env.BYPASS_SUPABASE_URL);
    console.log('[Maintenance API] BYPASS_SUPABASE_SERVICE_ROLE présent:', process.env.BYPASS_SUPABASE_SERVICE_ROLE ? 'OUI' : 'NON');
    console.log('[Maintenance API] NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    const supabaseUrl = process.env.BYPASS_SUPABASE_URL;
    const supabaseServiceKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE;

    if (!supabaseUrl || !supabaseServiceKey) {
      const errorDetails = {
        error: 'Configuration Supabase manquante',
        bypassUrl: process.env.BYPASS_SUPABASE_URL || 'MANQUANT',
        bypassServiceRole: process.env.BYPASS_SUPABASE_SERVICE_ROLE ? 'PRESENT' : 'MANQUANT',
        fallbackUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'MANQUANT'
      };
      console.error('[Maintenance API] ERREUR CONFIGURATION:', errorDetails);
      return NextResponse.json(errorDetails, { status: 500 });
    }

    console.log('[Maintenance API] URL utilisée:', supabaseUrl);
    console.log('[Maintenance API] Service role: PRESENT');

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

    console.log('[Maintenance API] SUCCESS! Data saved:', data);
    console.log('[Maintenance API] ===== FIN REQUETE (SUCCESS) =====');

    return NextResponse.json({ data, success: true });
  } catch (error: any) {
    console.error('[Maintenance API] ===== ERREUR CRITIQUE =====');
    console.error('[Maintenance API] Message:', error.message);
    console.error('[Maintenance API] Details:', error.details);
    console.error('[Maintenance API] Hint:', error.hint);
    console.error('[Maintenance API] Code:', error.code);
    console.error('[Maintenance API] Stack:', error.stack);
    console.error('[Maintenance API] ===== FIN ERREUR =====');

    return NextResponse.json(
      {
        error: error.message || 'Erreur inconnue',
        details: error.details || 'Pas de détails',
        hint: error.hint || 'Pas d\'indice',
        code: error.code || 'Pas de code',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
