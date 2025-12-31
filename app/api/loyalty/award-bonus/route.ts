import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({
        success: false,
        message: 'Missing user ID',
        points: 0
      }, { status: 200 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user's loyalty points
    const { data: loyaltyPoints, error: fetchError } = await supabase
      .from('loyalty_points')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (fetchError) {
      console.error('Fetch loyalty points error:', fetchError);
      return NextResponse.json({
        success: false,
        message: 'Erreur lors de la récupération des points',
        points: 0
      }, { status: 200 });
    }

    // Create loyalty points record if it doesn't exist
    if (!loyaltyPoints) {
      const { data: newPoints, error: createError } = await supabase
        .from('loyalty_points')
        .insert({
          user_id,
          page_visit_points: 0,
          live_participation_count: 0,
          order_points: 10,
          live_share_points: 0,
          total_points: 10
        })
        .select()
        .single();

      if (createError) {
        console.error('Create loyalty points error:', createError);
        return NextResponse.json({
          success: false,
          message: 'Erreur lors de la création des points',
          points: 0
        }, { status: 200 });
      }

      return NextResponse.json({
        success: true,
        message: 'Vous avez gagné 10 points de fidélité pour votre connexion quotidienne !',
        points: 10
      }, { status: 200 });
    }

    // Update existing loyalty points
    const newTotalPoints = (loyaltyPoints.total_points || 0) + 10;
    const newOrderPoints = (loyaltyPoints.order_points || 0) + 10;

    const { error: updateError } = await supabase
      .from('loyalty_points')
      .update({
        order_points: newOrderPoints,
        total_points: newTotalPoints
      })
      .eq('user_id', user_id);

    if (updateError) {
      console.error('Update bonus error:', updateError);
      return NextResponse.json({
        success: false,
        message: 'Erreur lors de l\'attribution du bonus',
        points: 0
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      message: 'Vous avez gagné 10 points de fidélité pour votre connexion quotidienne !',
      points: 10
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in award-daily-bonus:', error);
    return NextResponse.json({
      success: false,
      message: 'Une erreur est survenue',
      points: 0
    }, { status: 200 });
  }
}
