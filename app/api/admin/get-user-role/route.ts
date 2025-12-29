import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ role: 'user' }, { status: 200 });
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ role: 'user' }, { status: 200 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const token = authHeader.replace('Bearer ', '');

    // Utiliser getUser avec le token pour récupérer les métadonnées JWT (ne passe pas par PostgREST)
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      console.error('[get-user-role] User error:', userError);
      return NextResponse.json({ role: 'user' }, { status: 200 });
    }

    console.log('[get-user-role] User ID:', user.id);
    console.log('[get-user-role] User email:', user.email);
    console.log('[get-user-role] User metadata:', user.user_metadata);
    console.log('[get-user-role] App metadata:', user.app_metadata);

    // Vérifier le rôle dans app_metadata et user_metadata (dans le JWT, ne passe pas par PostgREST)
    const roleFromAppMeta = user.app_metadata?.role;
    const roleFromUserMeta = user.user_metadata?.role;
    const isAdminFromMeta = user.app_metadata?.is_admin === true;

    if (roleFromAppMeta === 'admin' || roleFromUserMeta === 'admin' || isAdminFromMeta) {
      console.log('[get-user-role] Admin détecté via métadonnées JWT');
      return NextResponse.json({ role: 'admin' }, { status: 200 });
    }

    console.log('[get-user-role] Utilisateur normal');
    return NextResponse.json({ role: 'user' }, { status: 200 });

  } catch (error) {
    console.error('Get user role error:', error);
    return NextResponse.json({ role: 'user' }, { status: 200 });
  }
}
