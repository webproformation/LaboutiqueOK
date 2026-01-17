import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email-sender';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = body.to || body.email;
    const firstName = body.data?.firstName || body.firstName || 'Voisine';

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await sendWelcomeEmail(email, firstName);

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
    console.error('Error in welcome email API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
