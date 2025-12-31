import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    let query = supabaseService
      .from('loyalty_points')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching loyalty points:', error);
      // Return empty array instead of error to avoid breaking the frontend
      return NextResponse.json([]);
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Error in loyalty points GET:', error);
    // Return empty array instead of error to avoid breaking the frontend
    return NextResponse.json([]);
  }
}
