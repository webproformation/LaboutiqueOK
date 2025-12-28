import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Query directly from Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('blocked, blocked_reason, cancelled_orders_count')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      blocked: profile.blocked || false,
      blockedReason: profile.blocked_reason || null,
      cancelledOrdersCount: profile.cancelled_orders_count || 0,
    });
  } catch (error) {
    console.error('Error in check-status route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check customer status' },
      { status: 500 }
    );
  }
}
