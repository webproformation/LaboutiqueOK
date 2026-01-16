import { NextRequest, NextResponse } from 'next/server';
import { sendReviewRequestEmail } from '@/lib/email-sender';
import { createClient } from '@/lib/supabase';

const CRON_SECRET = process.env.CRON_SECRET || 'your-secret-key-here';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');

    if (providedSecret !== CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles(email, first_name)
      `)
      .eq('status', 'shipped')
      .gte('shipped_at', eightDaysAgo.toISOString())
      .lt('shipped_at', sevenDaysAgo.toISOString())
      .is('review_email_sent', false);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }

    const emailsSent = [];
    const errors = [];

    for (const order of orders || []) {
      const profile = order.profiles as any;
      const email = profile?.email;
      const firstName = profile?.first_name || 'Client';

      if (!email) continue;

      const result = await sendReviewRequestEmail(email, firstName);

      if (result.success) {
        await supabase
          .from('orders')
          .update({ review_email_sent: true })
          .eq('id', order.id);

        emailsSent.push({ orderId: order.id, email });
      } else {
        errors.push({ orderId: order.id, error: result.error });
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      emailsSent: emailsSent.length,
      errors: errors.length,
      details: { emailsSent, errors }
    });
  } catch (error: any) {
    console.error('Error in review request cron:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
