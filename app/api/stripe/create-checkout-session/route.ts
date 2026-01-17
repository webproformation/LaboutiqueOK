import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('CRITICAL: STRIPE_SECRET_KEY is not defined in environment variables');
}

const stripeKey = process.env.STRIPE_SECRET_KEY || '';

if (stripeKey && !stripeKey.startsWith('sk_')) {
  console.warn('WARNING: STRIPE_SECRET_KEY should start with "sk_" (secret key), found:', stripeKey.substring(0, 8) + '...');
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-12-15.clover' as any,
});

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe Secret Key missing in environment');
      return NextResponse.json(
        { error: 'Stripe Secret Key missing. Payment processing unavailable.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log('Stripe checkout request received:', {
      orderId: body.orderId,
      userId: body.userId,
      itemsCount: body.items?.length,
      total: body.total,
      hasShipping: !!body.shipping_cost
    });

    const {
      orderId,
      userId,
      items,
      total,
      shipping_cost,
      metadata
    } = body;

    if (!orderId || !userId || !items || !Array.isArray(items) || items.length === 0) {
      console.error('Missing required fields:', { orderId, userId, itemsCount: items?.length });
      return NextResponse.json(
        { error: 'Missing required fields: orderId, userId, or items' },
        { status: 400 }
      );
    }

    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log('Using origin for redirects:', origin);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => {
      const priceInCents = Math.round(parseFloat(item.price) * 100);
      console.log(`Item: ${item.name}, Price: ${item.price}€ = ${priceInCents} cents, Qty: ${item.quantity}`);

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name || 'Produit',
            description: item.variation ? `Variation: ${item.variation}` : undefined,
            images: item.image ? [item.image] : undefined,
          },
          unit_amount: priceInCents,
        },
        quantity: item.quantity || 1,
      };
    });

    if (shipping_cost && parseFloat(shipping_cost) > 0) {
      const shippingInCents = Math.round(parseFloat(shipping_cost) * 100);
      console.log(`Adding shipping: ${shipping_cost}€ = ${shippingInCents} cents`);

      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Frais de livraison',
            description: 'Frais de port',
          },
          unit_amount: shippingInCents,
        },
        quantity: 1,
      });
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${origin}/checkout/confirmation?order=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=true`,
      customer_email: metadata?.email || undefined,
      metadata: {
        orderId: orderId.toString(),
        userId: userId.toString(),
        ...(metadata || {}),
      },
    };

    console.log('Creating Stripe session with params:', {
      mode: sessionParams.mode,
      itemsCount: lineItems.length,
      success_url: sessionParams.success_url,
      cancel_url: sessionParams.cancel_url,
      customer_email: sessionParams.customer_email
    });

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log('Stripe session created successfully:', {
      sessionId: session.id,
      paymentIntent: session.payment_intent,
      url: session.url
    });

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent as string || null,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order with Stripe session:', updateError);
    } else {
      console.log('Order updated with Stripe session ID:', orderId);
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error: any) {
    console.error('Stripe checkout session error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      raw: error.raw
    });

    const errorMessage = error.message || 'Failed to create checkout session';
    const detailedError = error.type ? `${error.type}: ${errorMessage}` : errorMessage;

    return NextResponse.json(
      {
        error: detailedError,
        details: process.env.NODE_ENV === 'development' ? {
          type: error.type,
          code: error.code,
          message: error.message
        } : undefined
      },
      { status: 500 }
    );
  }
}
