import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json([{
        tier: 1,
        multiplier: 1,
        tier_name: 'Palier 1',
        current_balance: 0,
        next_tier_threshold: 200
      }], { status: 200 });
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

    const { data: pointsData, error: pointsError } = await supabase
      .from('loyalty_points')
      .select('points')
      .eq('user_id', user_id);

    if (pointsError) {
      console.error('Loyalty points error:', pointsError);
      return NextResponse.json([{
        tier: 1,
        multiplier: 1,
        tier_name: 'Palier 1',
        current_balance: 0,
        next_tier_threshold: 200
      }], { status: 200 });
    }

    const totalPoints = pointsData?.reduce((sum: number, p: any) => sum + (p.points || 0), 0) || 0;
    const current_balance = totalPoints * 0.01;

    let tier = 1;
    let multiplier = 1;
    let tier_name = 'Palier 1';
    let next_tier_threshold = 200;

    if (current_balance >= 500) {
      tier = 3;
      multiplier = 3;
      tier_name = 'Palier 3';
      next_tier_threshold = 500;
    } else if (current_balance >= 200) {
      tier = 2;
      multiplier = 2;
      tier_name = 'Palier 2';
      next_tier_threshold = 500;
    }

    return NextResponse.json([{
      tier,
      multiplier,
      tier_name,
      current_balance,
      next_tier_threshold
    }], { status: 200 });
  } catch (error: any) {
    console.error('Error in get-loyalty-tier:', error);
    return NextResponse.json([{
      tier: 1,
      multiplier: 1,
      tier_name: 'Palier 1',
      current_balance: 0,
      next_tier_threshold: 200
    }], { status: 200 });
  }
}
