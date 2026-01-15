import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  
  // 1. Initialisation du client Supabase (Compatible Serveur)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) { try { cookieStore.set({ name, value, ...options }) } catch {} },
        remove(name: string, options: any) { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
      },
    }
  );

  let user = null;

  // 2. Stratégie A : Authentification par Cookie (Standard)
  const { data: userDataCookie } = await supabase.auth.getUser();
  if (userDataCookie.user) {
    user = userDataCookie.user;
  }

  // 3. Stratégie B : Authentification par Token dans le Header (Secours)
  // C'est ce bloc qui va sauver la mise car votre Frontend envoie maintenant le token !
  if (!user) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userDataToken } = await supabase.auth.getUser(token);
      if (userDataToken.user) {
        user = userDataToken.user;
      }
    }
  }

  // 4. Vérification Finale
  if (!user) {
    console.error("Auth Failed: Ni Cookie ni Token valide.");
    return NextResponse.json(
      { error: 'Non authentifié. Veuillez vous reconnecter.' }, 
      { status: 401 }
    );
  }

  // --- LOGIQUE MÉTIER (Distribution des coupons) ---
  try {
    const body = await request.json();
    const { game_type, game_id, coupon_code, has_won } = body;

    // Si perdu, on enregistre juste la partie (pas besoin de coupon)
    if (!has_won) {
       return NextResponse.json({ success: true, message: "Partie perdue enregistrée" });
    }

    if (!coupon_code) {
        return NextResponse.json({ error: 'Code coupon manquant' }, { status: 400 });
    }

    // Récupération des infos du coupon
    const { data: couponType } = await supabase
        .from('coupon_types')
        .select('*')
        .eq('code', coupon_code)
        .maybeSingle();

    if (!couponType) {
        return NextResponse.json({ error: 'Configuration coupon manquante' }, { status: 404 });
    }

    // Vérification si déjà gagné (Anti-Spam)
    const { data: existing } = await supabase
        .from('user_coupons')
        .select('id')
        .eq('user_id', user.id)
        .eq('coupon_type_id', couponType.id)
        .maybeSingle();
      
    if (existing) {
        return NextResponse.json({ success: true, already_owned: true });
    }

    // Attribution du Coupon
    const uniqueCode = `${coupon_code}-${Date.now().toString(36).toUpperCase()}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    
    const { error: insertError } = await supabase.from('user_coupons').insert({
      user_id: user.id,
      coupon_type_id: couponType.id,
      code: uniqueCode,
      source: game_type || 'game',
      is_used: false,
      valid_until: validUntil.toISOString()
    });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, code: uniqueCode });

  } catch (e: any) {
    console.error("Game Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}