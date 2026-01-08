import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      userId,
      items,
      total,
      metadata
    } = body;

    if (!orderId || !userId || !items || !total) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
          description: item.variation ? `Variation: ${item.variation}` : undefined,
          images: item.image ? [item.image] : undefined,
        },
        unit_amount: Math.round(parseFloat(item.price) * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin')}/checkout/confirmation?order=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin')}/checkout?canceled=true`,
      customer_email: metadata?.email,
      metadata: {
        orderId,
        userId,
        ...metadata,
      },
    });

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order with Stripe session:', updateError);
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error: any) {
    console.error('Stripe checkout session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
