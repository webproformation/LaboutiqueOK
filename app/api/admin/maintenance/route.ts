import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('[Maintenance API GET] ===== DEBUT REQUETE GET =====');
    console.log('[Maintenance API GET] BYPASS_SUPABASE_URL:', process.env.BYPASS_SUPABASE_URL);
    console.log('[Maintenance API GET] BYPASS_SUPABASE_SERVICE_ROLE_KEY présent:', process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY ? 'OUI' : 'NON');

    const supabaseUrl = process.env.BYPASS_SUPABASE_URL;
    const supabaseServiceKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      const errorDetails = {
        error: 'Configuration Supabase manquante',
        bypassUrl: process.env.BYPASS_SUPABASE_URL || 'MANQUANT',
        bypassServiceRoleKey: process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MANQUANT'
      };
      console.error('[Maintenance API GET] ERREUR CONFIGURATION:', errorDetails);
      return NextResponse.json(errorDetails, { status: 500 });
    }

    console.log('[Maintenance API GET] URL utilisée:', supabaseUrl);

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
      console.error('[Maintenance API GET] Supabase error:', error);
      return NextResponse.json({
        error: error.message,
        details: error.details || 'Pas de détails',
        hint: error.hint || 'Pas d\'indice',
        code: error.code || 'Pas de code'
      }, { status: 500 });
    }

    console.log('[Maintenance API GET] SUCCESS! Data retrieved');
    return NextResponse.json({ data: data || null });
  } catch (error: any) {
    console.error('[Maintenance API GET] ERREUR CRITIQUE:', error);
    return NextResponse.json({
      error: error.message || 'Erreur inconnue',
      details: error.details || 'Pas de détails',
      hint: error.hint || 'Pas d\'indice',
      code: error.code || 'Pas de code',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[Maintenance API POST] ===== DEBUT REQUETE POST =====');
    console.log('[Maintenance API POST] API Maintenance - URL:', process.env.BYPASS_SUPABASE_URL);
    console.log('[Maintenance API POST] BYPASS_SUPABASE_SERVICE_ROLE_KEY présent:', process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY ? 'OUI' : 'NON');

    const supabaseUrl = process.env.BYPASS_SUPABASE_URL;
    const supabaseServiceKey = process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      const errorDetails = {
        error: 'Configuration Supabase manquante - Variables BYPASS non définies',
        bypassUrl: process.env.BYPASS_SUPABASE_URL || 'MANQUANT',
        bypassServiceRoleKey: process.env.BYPASS_SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MANQUANT'
      };
      console.error('[Maintenance API POST] ERREUR CONFIGURATION:', errorDetails);
      return NextResponse.json(errorDetails, { status: 500 });
    }

    console.log('[Maintenance API POST] ✓ URL utilisée:', supabaseUrl);
    console.log('[Maintenance API POST] ✓ Service role: PRESENT');

    if (!supabaseUrl.includes('qcqbtmv')) {
      console.error('[Maintenance API POST] ⚠️ ATTENTION: URL ne contient pas "qcqbtmv" - Mauvaise base de données!');
      return NextResponse.json({
        error: 'URL Supabase incorrecte',
        receivedUrl: supabaseUrl,
        expectedPattern: 'qcqbtmvbvipsxwjlgjvk.supabase.co'
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await request.json();
    const { is_maintenance_mode, maintenance_message, maintenance_start, maintenance_end, wordpress_url } = body;

    console.log('[Maintenance API POST] Données reçues:', { is_maintenance_mode, maintenance_message, maintenance_start, maintenance_end, wordpress_url });

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

    if (wordpress_url !== undefined) {
      upsertData.wordpress_url = wordpress_url;
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

    console.log('[Maintenance API POST] Données à upsert:', upsertData);

    const { data, error } = await supabase
      .from('site_settings')
      .upsert(upsertData, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      console.error('[Maintenance API POST] ❌ ERREUR SUPABASE:', error);
      return NextResponse.json(
        {
          error: error.message,
          details: error.details || 'Aucun détail disponible',
          hint: error.hint || 'Aucune indication disponible',
          code: error.code || 'Pas de code',
          supabaseError: JSON.stringify(error)
        },
        { status: 500 }
      );
    }

    console.log('[Maintenance API POST] ✅ SUCCESS! Données sauvegardées:', data);
    console.log('[Maintenance API POST] ===== FIN REQUETE (SUCCESS) =====');

    return NextResponse.json({ data, success: true });
  } catch (error: any) {
    console.error('[Maintenance API POST] ===== ❌ ERREUR CRITIQUE =====');
    console.error('[Maintenance API POST] Message:', error.message);
    console.error('[Maintenance API POST] Details:', error.details);
    console.error('[Maintenance API POST] Hint:', error.hint);
    console.error('[Maintenance API POST] Code:', error.code);
    console.error('[Maintenance API POST] Stack:', error.stack);
    console.error('[Maintenance API POST] Erreur complète:', JSON.stringify(error, null, 2));
    console.error('[Maintenance API POST] ===== FIN ERREUR =====');

    return NextResponse.json(
      {
        error: error.message || 'Erreur inconnue',
        details: error.details || 'Pas de détails',
        hint: error.hint || 'Pas d\'indice',
        code: error.code || 'Pas de code',
        fullError: JSON.stringify(error),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        usedUrl: process.env.BYPASS_SUPABASE_URL
      },
      { status: 500 }
    );
  }
}
