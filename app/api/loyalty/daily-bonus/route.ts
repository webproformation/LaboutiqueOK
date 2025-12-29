import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Check last bonus date
    const { data: lastBonus } = await supabaseService
      .from('loyalty_points')
      .select('created_at')
      .eq('user_id', user_id)
      .eq('bonus_type', 'daily_connection')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check if already awarded today
    if (lastBonus) {
      const lastBonusDate = new Date(lastBonus.created_at).toDateString();
      const today = new Date().toDateString();

      if (lastBonusDate === today) {
        return NextResponse.json({
          success: false,
          message: 'Bonus already awarded today',
          points: 0
        });
      }
    }

    // Award bonus
    const { error } = await supabaseService
      .from('loyalty_points')
      .insert({
        user_id,
        points: 10,
        bonus_type: 'daily_connection',
        description: 'Bonus de connexion quotidien'
      });

    if (error) {
      console.error('Error awarding daily bonus:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Bonus awarded successfully',
      points: 10
    });
  } catch (error: any) {
    console.error('Error in daily bonus POST:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
