import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js'; // Client standard pour le mode Admin

export async function POST(request: NextRequest) {
  const cookieStore = cookies();
  
  // 1. D'ABORD, ON VÉRIFIE L'IDENTITÉ (Sécurité normale)
  // On utilise le client SSR juste pour vérifier QUI fait la demande
  const supabaseAuth = createServerClient(
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
  
  // Vérification Auth (Cookie ou Token)
  const { data: userDataCookie } = await supabaseAuth.auth.getUser();
  user = userDataCookie.user;

  if (!user) {
    // Fallback Token Bearer
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userDataToken } = await supabaseAuth.auth.getUser(token);
      user = userDataToken.user;
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  // 2. LE "GOD MODE" (Service Role)
  // Maintenant qu'on sait qui c'est, on utilise la SUPER CLÉ pour écrire dans la base
  // Cette clé IGNORE les règles RLS (Row Level Security)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // <--- C'EST LA CLÉ MAGIQUE
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    const body = await request.json();
    const { game_type, game_id, coupon_code, has_won } = body;

    if (!has_won) return NextResponse.json({ success: true, message: "Perdu enregistré" });
    if (!coupon_code) return NextResponse.json({ error: 'Code manquant' }, { status: 400 });

    // A. Recherche dans la table 'coupons' avec les droits ADMIN
    const { data: coupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', coupon_code)
        .maybeSingle();

    if (!coupon) return NextResponse.json({ error: 'Coupon introuvable (Admin Check)' }, { status: 404 });

    // B. Vérification doublon
    const { data: existing } = await supabaseAdmin
        .from('user_coupons')
        .select('id')
        .eq('user_id', user.id)
        .eq('coupon_id', coupon.id) 
        .maybeSingle();
      
    if (existing) return NextResponse.json({ success: true, already_owned: true });

    // C. Attribution FORCÉE (Bypass RLS)
    const uniqueCode = `${coupon_code}-${Date.now().toString(36).toUpperCase()}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);
    
    // On utilise supabaseAdmin pour l'insertion
    const { error: insertError } = await supabaseAdmin.from('user_coupons').insert({
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