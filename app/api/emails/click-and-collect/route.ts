import { NextRequest, NextResponse } from 'next/server';
import { sendClickAndCollectEmail } from '@/lib/email-sender';

export async function POST(request: NextRequest) {
  try {
    const { to, data } = await request.json();

    if (!to) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await sendClickAndCollectEmail(
      to,
      data.firstName || 'Voisine'
    );

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
    console.error('Error in click-and-collect email API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
