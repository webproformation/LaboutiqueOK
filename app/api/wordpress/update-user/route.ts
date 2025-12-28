import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wordpressUserId, firstName, lastName, phone } = body;

    const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-wordpress-user`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ wordpressUserId, firstName, lastName, phone }),
    });

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in update-user route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update WordPress user' },
      { status: 500 }
    );
  }
}
