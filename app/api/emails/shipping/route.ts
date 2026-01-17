import { NextRequest, NextResponse } from 'next/server';
import { sendShippingEmail } from '@/lib/email-sender';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support pour deux formats: trigger (to/data) ou manuel (orderId)
    if (body.to && body.data) {
      // Format trigger (appelé depuis la base de données)
      const result = await sendShippingEmail(
        body.to,
        body.data.firstName || 'Voisine',
        body.data.trackingNumber || 'Non disponible',
        body.data.trackingUrl
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
    }

    // Format manuel (avec orderId)
    const { orderId, trackingNumber, trackingUrl } = body;

    if (!orderId || !trackingNumber) {
      return NextResponse.json(
        { error: 'orderId and trackingNumber are required (or use to/data format)' },
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
