import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    console.log('[claim-reward] Auth check:', {
      hasUser: !!user,
      hasError: !!userError,
      userId: user?.id,
      errorMessage: userError?.message,
    });

    if (userError) {
      console.error('[claim-reward] User error:', userError);
      return NextResponse.json(
        { error: 'Erreur d\'authentification', details: userError.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('[claim-reward] No user found');
      return NextResponse.json(
        { error: 'Non authentifié - Veuillez vous reconnecter' },
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
