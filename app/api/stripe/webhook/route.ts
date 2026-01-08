import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const orderId = session.metadata?.orderId;

        if (!orderId) {
          console.error('No orderId in session metadata');
          break;
        }

        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            paid_at: new Date().toISOString(),
            stripe_payment_intent: session.payment_intent as string,
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('Error updating order payment status:', updateError);
        } else {
          console.log(`Order ${orderId} marked as paid`);
        }

        const userId = session.metadata?.userId;
        if (userId) {
          const loyaltyPoints = Math.floor(parseFloat(session.amount_total?.toString() || '0') / 100);

          const { error: loyaltyError } = await supabase
            .from('loyalty_points')
            .insert({
              user_id: userId,
              points: loyaltyPoints,
              type: 'purchase',
              description: `Achat commande ${orderId}`,
              order_id: orderId,
            });

          if (loyaltyError) {
            console.error('Error adding loyalty points:', loyaltyError);
          }
        }

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('PaymentIntent succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const { data: orders } = await supabase
          .from('orders')
          .select('id')
          .eq('stripe_payment_intent', paymentIntent.id)
          .single();

        if (orders) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'failed',
              status: 'cancelled',
            })
            .eq('id', orders.id);
        }

        console.log('PaymentIntent failed:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
