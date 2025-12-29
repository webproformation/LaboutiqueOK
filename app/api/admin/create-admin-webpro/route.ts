import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuration Supabase manquante' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password, firstName, lastName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 1. Vérifier si l'utilisateur existe déjà via API Admin (ne passe pas par PostgREST)
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
      console.log('[create-admin] Utilisateur existant trouvé:', userId);

      // Mettre à jour les métadonnées JWT pour marquer comme admin
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          first_name: firstName || 'Admin',
          last_name: lastName || 'WebPro',
          role: 'admin'
        },
        app_metadata: {
          role: 'admin',
          is_admin: true
        }
      });

      if (updateError) {
        console.error('[create-admin] Erreur mise à jour métadonnées:', updateError);
      } else {
        console.log('[create-admin] Métadonnées JWT mises à jour avec succès');
      }
    } else {
      // 2. Créer l'utilisateur avec l'API Admin (ne passe pas par PostgREST)
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName || 'Admin',
          last_name: lastName || 'WebPro',
          role: 'admin'
        },
        app_metadata: {
          role: 'admin',
          is_admin: true
        }
      });

      if (createError) {
        console.error('[create-admin] Erreur création utilisateur:', createError);
        return NextResponse.json(
          { error: `Erreur création utilisateur: ${createError.message}` },
          { status: 500 }
        );
      }

      userId = newUser.user.id;
      console.log('[create-admin] Nouvel utilisateur créé:', userId);
    }

    return NextResponse.json({
      success: true,
      message: existingUser
        ? 'Utilisateur existant configuré en admin avec succès!'
        : 'Compte admin créé avec succès!',
      user: {
        id: userId,
        email
      },
      details: {
        jwt_updated: true,
        app_metadata_role: 'admin',
        user_metadata_role: 'admin',
        is_admin: true
      },
      instructions: 'Déconnectez-vous et reconnectez-vous pour que les changements JWT prennent effet.'
    });

  } catch (error: any) {
    console.error('[create-admin] Erreur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur inconnue' },
      { status: 500 }
    );
  }
}
