import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: NextRequest) {
  const cookieStore = cookies();

  // 1. Auth Setup (Hybride : Cookie + Token)
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
  // Stratégie A : Cookie
  const { data: userDataCookie } = await supabase.auth.getUser();
  user = userDataCookie.user;
  // Stratégie B : Token Bearer
  if (!user) {
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userDataToken } = await supabase.auth.getUser(token);
      user = userDataToken.user;
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  // 2. LOGIQUE MÉTIER UNIFIÉE (Table 'coupons')
  try {
    const body = await request.json();
    const { game_type, game_id, coupon_code, has_won } = body;

    if (!has_won) return NextResponse.json({ success: true, message: "Perdu enregistré" });
    if (!coupon_code) return NextResponse.json({ error: 'Code manquant' }, { status: 400 });

    // A. Recherche dans la table 'coupons' (et non coupon_types)
    const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code)
        .maybeSingle();

    if (!coupon) return NextResponse.json({ error: 'Coupon introuvable dans la base Admin' }, { status: 404 });

    // B. Vérification doublon (table user_coupons)
    // On vérifie si l'user a déjà gagné CE coupon spécifique (coupon_id)
    const { data: existing } = await supabase.from('user_coupons')
        .select('id')
        .eq('user_id', user.id)
        .eq('coupon_id', coupon.id)
        .maybeSingle();

    if (existing) return NextResponse.json({ success: true, already_owned: true });

    // C. Attribution (Insertion avec coupon_id)
    const uniqueCode = `${coupon_code}-${Date.now().toString(36).toUpperCase()}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const { error: insertError } = await supabase.from('user_coupons').insert({
      user_id: user.id,
      coupon_id: coupon.id,
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
