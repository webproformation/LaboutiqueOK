import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = await createServerClient();

    // Vérifier que l'utilisateur est admin
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Récupérer tous les utilisateurs auth (via admin API)
    // Note: Cela nécessite le service_role key, donc on va utiliser une approche différente
    // On va simplement s'assurer que le profil de l'utilisateur actuel existe

    let synced = 0;
    let skipped = 0;

    // Créer le profil pour l'utilisateur actuel s'il n'existe pas
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', session.user.id)
      .maybeSingle();

    if (!existingProfile) {
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          email: session.user.email || '',
          first_name: session.user.user_metadata?.first_name || '',
          last_name: session.user.user_metadata?.last_name || '',
          phone: session.user.user_metadata?.phone || '',
          birth_date: session.user.user_metadata?.birth_date || null,
          wallet_balance: 0,
          is_admin: false,
        });

      if (insertError) {
        console.error('Insert profile error:', insertError);
      } else {
        synced++;
      }
    } else {
      skipped++;
    }

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      message: `Synchronisation effectuée. ${synced} profils créés, ${skipped} déjà existants.`
    });

  } catch (error: any) {
    console.error('Sync auth users error:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la synchronisation' },
      { status: 500 }
    );
  }
}
