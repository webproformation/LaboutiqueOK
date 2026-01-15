import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {}
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch {}
          },
        },
      }
    );

    let user = null;

    const { data: userDataCookie } = await supabase.auth.getUser();
    user = userDataCookie.user;

    if (!user) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: userDataToken } = await supabase.auth.getUser(token);
        user = userDataToken.user;
        console.log('[claim-reward] Auth via Token Bearer:', {
          hasUser: !!user,
          userId: user?.id,
        });
      }
    } else {
      console.log('[claim-reward] Auth via Cookie:', {
        hasUser: !!user,
        userId: user?.id,
      });
    }

    if (!user) {
      console.error('[claim-reward] Auth Failed: No Cookie and No Valid Token found.');
      return NextResponse.json(
        { error: 'Non authentifié - Echec Cookie ET Token' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const body = await request.json();
    const { game_type, game_id, coupon_code, has_won } = body;

    if (!game_type || !game_id || typeof has_won !== 'boolean') {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    if (has_won && coupon_code) {
      const { data: couponType, error: couponTypeError } = await supabase
        .from('coupon_types')
        .select('id, code, type, value, description')
        .eq('code', coupon_code)
        .maybeSingle();

      if (couponTypeError) {
        console.error('Database error fetching coupon type:', { coupon_code, error: couponTypeError });
        return NextResponse.json(
          { error: 'Erreur base de données', details: couponTypeError.message },
          { status: 500 }
        );
      }

      if (!couponType) {
        console.error('Coupon type not found:', { coupon_code });
        return NextResponse.json(
          {
            error: 'Type de coupon introuvable',
            coupon_code,
            message: 'Le type de coupon doit être configuré dans coupon_types avant utilisation'
          },
          { status: 404 }
        );
      }

      const { data: existingAssignment } = await supabase
        .from('user_coupons')
        .select('id')
        .eq('user_id', userId)
        .eq('coupon_type_id', couponType.id)
        .eq('is_used', false)
        .maybeSingle();

      if (!existingAssignment) {
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 30);

        const uniqueCode = `${coupon_code}-${Date.now().toString(36)}`;

        const { data: newCoupon, error: insertError } = await supabase
          .from('user_coupons')
          .insert({
            user_id: userId,
            coupon_type_id: couponType.id,
            code: uniqueCode,
            source: game_type,
            is_used: false,
            valid_until: validUntil.toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting user coupon:', insertError);
          return NextResponse.json(
            { error: 'Erreur lors de l\'attribution du coupon', details: insertError },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Coupon attribué avec succès',
          coupon: {
            code: uniqueCode,
            type: couponType.type,
            value: couponType.value,
            description: couponType.description,
            valid_until: validUntil.toISOString(),
          },
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'Vous possédez déjà ce coupon',
          already_owned: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Partie enregistrée',
      has_won: false,
    });
  } catch (error) {
    console.error('Error in claim-reward:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
