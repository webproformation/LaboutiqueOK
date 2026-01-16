import { NextRequest, NextResponse } from 'next/server';
import { sendDiamondFoundEmail } from '@/lib/email-sender';

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, amount } = await request.json();

    if (!email || !firstName || amount === undefined) {
      return NextResponse.json(
        { error: 'email, firstName, and amount are required' },
        { status: 400 }
      );
    }

    const result = await sendDiamondFoundEmail(email, firstName, amount);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId
    });
  } catch (error: any) {
    console.error('Error in diamond email API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
