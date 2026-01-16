import { NextRequest, NextResponse } from 'next/server';
import { sendShippingEmail } from '@/lib/email-sender';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { orderId, trackingNumber, trackingUrl } = await request.json();

    if (!orderId || !trackingNumber) {
      return NextResponse.json(
        { error: 'orderId and trackingNumber are required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles(email, first_name)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const profile = order.profiles as any;
    const email = profile?.email;
    const firstName = profile?.first_name || 'Client';

    if (!email) {
      return NextResponse.json(
        { error: 'No email found for this order' },
        { status: 400 }
      );
    }

    const result = await sendShippingEmail(
      email,
      firstName,
      trackingNumber,
      trackingUrl
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
    console.error('Error in shipping email API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
