import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

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

  // 2. God Mode Client (Contourne RLS)
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 3. LOGIQUE MÉTIER avec Algorithme Pondéré
  try {
    const body = await request.json();
    const { game_type, game_id, coupon_code, has_won } = body;

    // Cas spécial Card Flip : Tirage au sort pondéré
    if (game_type === 'card_flip' && game_id) {
      // A. Charger le jeu et sa probabilité
      const { data: game } = await supabaseAdmin
        .from('card_flip_games')
        .select('*, coupon:coupons(*)')
        .eq('id', game_id)
        .single();

      if (!game) {
        return NextResponse.json({ error: 'Jeu introuvable' }, { status: 404 });
      }

      // B. Vérifier si l'utilisateur a encore des tentatives
      const { data: playCount } = await supabaseAdmin
        .from('card_flip_game_plays')
        .select('id', { count: 'exact' })
        .eq('game_id', game_id)
        .eq('user_id', user.id);

      const currentPlays = playCount?.length || 0;

      if (currentPlays >= game.max_plays_per_user) {
        return NextResponse.json({
          error: 'Nombre maximum de parties atteint',
          max_reached: true
        }, { status: 403 });
      }

      // C. Algorithme de tirage au sort pondéré
      const winProbability = game.win_probability || 33.33;
      const randomValue = Math.random() * 100;
      const userHasWon = randomValue <= winProbability;

      // D. Enregistrer la partie
      const { error: playError } = await supabaseAdmin
        .from('card_flip_game_plays')
        .insert({
          game_id: game_id,
          user_id: user.id,
          has_won: userHasWon,
          coupon_code: userHasWon ? game.coupon.code : null,
        });

      if (playError) throw playError;

      // E. Si perdu, retourner directement
      if (!userHasWon) {
        return NextResponse.json({
          success: true,
          has_won: false,
          message: 'Perdu cette fois-ci. Retentez votre chance !'
        });
      }

      // F. Si gagné, attribuer le coupon
      const { data: existingCoupon } = await supabaseAdmin
        .from('user_coupons')
        .select('id')
        .eq('user_id', user.id)
        .eq('coupon_id', game.coupon.id)
        .maybeSingle();

      if (existingCoupon) {
        return NextResponse.json({
          success: true,
          has_won: true,
          already_owned: true,
          coupon: game.coupon
        });
      }

      // G. Créer le coupon utilisateur
      const uniqueCode = `${game.coupon.code}-${Date.now().toString(36).toUpperCase()}`;
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      const { error: insertError } = await supabaseAdmin
        .from('user_coupons')
        .insert({
          user_id: user.id,
          coupon_id: game.coupon.id,
          code: uniqueCode,
          source: 'card_flip',
          is_used: false,
          valid_until: validUntil.toISOString()
        });

      if (insertError) throw insertError;

      return NextResponse.json({
        success: true,
        has_won: true,
        code: uniqueCode,
        coupon: game.coupon
      });
    }

    // Autres jeux (roue, carte à gratter, etc.) - Logique existante
    if (!has_won) {
      return NextResponse.json({ success: true, message: "Perdu enregistré" });
    }

    if (!coupon_code) {
      return NextResponse.json({ error: 'Code manquant' }, { status: 400 });
    }

    // A. Recherche dans la table 'coupons'
    const { data: coupon } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', coupon_code)
      .maybeSingle();

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon introuvable dans la base Admin' }, { status: 404 });
    }

    // B. Vérification doublon
    const { data: existing } = await supabaseAdmin
      .from('user_coupons')
      .select('id')
      .eq('user_id', user.id)
      .eq('coupon_id', coupon.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, already_owned: true });
    }

    // C. Attribution
    const uniqueCode = `${coupon_code}-${Date.now().toString(36).toUpperCase()}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const { error: insertError } = await supabaseAdmin
      .from('user_coupons')
      .insert({
        user_id: user.id,
        coupon_id: coupon.id,
        code: uniqueCode,
        source: game_type || 'game',
        is_used: false,
        valid_until: validUntil.toISOString()
      });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, code: uniqueCode, coupon });

  } catch (e: any) {
    console.error("Game Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
