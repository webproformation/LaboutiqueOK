import { NextRequest, NextResponse } from 'next/server';
import { sendOpenPackageStartEmail, sendOpenPackageAddEmail } from '@/lib/email-sender';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { packageId, orderId, type } = await request.json();

    if (!packageId || !orderId || !type) {
      return NextResponse.json(
        { error: 'packageId, orderId, and type are required' },
        { status: 400 }
      );
    }

    if (type !== 'start' && type !== 'add') {
      return NextResponse.json(
        { error: 'type must be "start" or "add"' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const { data: pkg, error: pkgError } = await supabase
      .from('open_packages')
      .select('*, profiles(email, first_name)')
      .eq('id', packageId)
      .single();

    if (pkgError || !pkg) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('order_number')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const profile = pkg.profiles as any;
    const email = profile?.email;
    const firstName = profile?.first_name || 'Client';

    if (!email) {
      return NextResponse.json(
        { error: 'No email found for this package' },
        { status: 400 }
      );
    }

    const closingDate = new Date(pkg.closes_at).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let result;
    if (type === 'start') {
      result = await sendOpenPackageStartEmail(
        email,
        firstName,
        order.order_number,
        closingDate
      );
    } else {
      result = await sendOpenPackageAddEmail(
        email,
        firstName,
        order.order_number,
        closingDate
      );
    }

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
    console.error('Error in open package email API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
