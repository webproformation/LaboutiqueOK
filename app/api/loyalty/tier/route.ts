import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false, autoRefreshToken: false }
  }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

    // Fetch loyalty points from table
    const { data: pointsData, error } = await supabase
      .from('loyalty_points')
      .select('total_points')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching loyalty points:', error);
      // Return default tier on error
      return NextResponse.json([{
        tier: 1,
        multiplier: 1,
        tier_name: 'Palier 1',
        current_balance: 0,
        next_tier_threshold: 200
      }], { status: 200 });
    }

    // If no record found, return default tier
    if (!pointsData) {
      console.log('No loyalty points found for user:', userId);
      return NextResponse.json([{
        tier: 1,
        multiplier: 1,
        tier_name: 'Palier 1',
        current_balance: 0,
        next_tier_threshold: 200
      }], { status: 200 });
    }

    const totalPoints = pointsData.total_points || 0;

    // Determine tier and multiplier based on balance
    let tier = 1;
    let multiplier = 1;
    let tier_name = 'Palier 1';
    let next_tier_threshold = 200;

    // Convert points to euros (1 point = 0.01€)
    const current_balance = totalPoints * 0.01;

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
    }]);
  } catch (error: any) {
    console.error('Error in tier GET:', error);
    // Return default tier on any error
    return NextResponse.json([{
      tier: 1,
      multiplier: 1,
      tier_name: 'Palier 1',
      current_balance: 0,
      next_tier_threshold: 200
    }], { status: 200 });
  }
}
