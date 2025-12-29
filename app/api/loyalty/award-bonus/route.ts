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

    const { data: lastBonus } = await supabase
      .from('loyalty_points')
      .select('created_at')
      .eq('user_id', user_id)
      .eq('bonus_type', 'daily_connection')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastBonus) {
      const lastBonusDate = new Date(lastBonus.created_at).toDateString();
      const today = new Date().toDateString();

      if (lastBonusDate === today) {
        return NextResponse.json({
          success: false,
          message: 'Bonus déjà attribué aujourd\'hui',
          points: 0
        }, { status: 200 });
      }
    }

    const { error } = await supabase
      .from('loyalty_points')
      .insert({
        user_id,
        points: 10,
        bonus_type: 'daily_connection',
        description: 'Bonus de connexion quotidien'
      });

    if (error) {
      console.error('Award bonus error:', error);
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
