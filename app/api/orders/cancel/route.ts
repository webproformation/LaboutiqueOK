import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, orderId } = body;

    if (!userId || !orderId) {
      return NextResponse.json(
        { success: false, error: 'userId and orderId are required' },
        { status: 400 }
      );
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/handle-order-cancellation`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, orderId }),
    });

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in cancel order route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to handle order cancellation' },
      { status: 500 }
    );
  }
}
