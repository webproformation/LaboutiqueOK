import { NextRequest, NextResponse } from 'next/server';
import { sendAbandonedCartEmail } from '@/lib/email-sender';
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
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const { data: carts, error: cartsError } = await supabase
      .from('cart_items')
      .select(`
        user_id,
        created_at,
        profiles(email, first_name, abandoned_cart_email_sent)
      `)
      .lt('created_at', twoHoursAgo);

    if (cartsError) {
      console.error('Error fetching carts:', cartsError);
      return NextResponse.json(
        { error: 'Failed to fetch carts' },
        { status: 500 }
      );
    }

    const userCartsMap = new Map();
    carts?.forEach((item: any) => {
      const userId = item.user_id;
      if (!userCartsMap.has(userId)) {
        userCartsMap.set(userId, item);
      }
    });

    const emailsSent = [];
    const errors = [];

    for (const [userId, cartItem] of Array.from(userCartsMap.entries())) {
      const profile = cartItem.profiles;

      if (!profile || profile.abandoned_cart_email_sent) {
        continue;
      }

      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', twoHoursAgo);

      if (orders && orders.length > 0) {
        continue;
      }

      const email = profile.email;
      const firstName = profile.first_name || 'Client';

      if (!email) continue;

      const result = await sendAbandonedCartEmail(email, firstName);

      if (result.success) {
        await supabase
          .from('profiles')
          .update({ abandoned_cart_email_sent: true })
          .eq('id', userId);

        emailsSent.push({ userId, email });
      } else {
        errors.push({ userId, error: result.error });
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
    console.error('Error in abandoned cart cron:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
