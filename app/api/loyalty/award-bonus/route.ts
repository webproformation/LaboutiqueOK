import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: 'public' } }
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

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Vous avez gagné 10 points de fidélité pour votre connexion quotidienne !',
      points: 10
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in award-daily-bonus:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
