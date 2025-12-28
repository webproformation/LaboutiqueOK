import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, password } = body;

    const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-wordpress-user`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, firstName, lastName, password }),
    });

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in create-user route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create WordPress user' },
      { status: 500 }
    );
  }
}
