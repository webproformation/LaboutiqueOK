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
    console.log('Stripe PaymentIntent request received:', {
      orderId: body.orderId,
      userId: body.userId,
      total: body.total,
    });

    const {
      orderId,
      userId,
      total,
      metadata
    } = body;

    if (!orderId || !userId || !total) {
      console.error('Missing required fields:', { orderId, userId, total });
      return NextResponse.json(
        { error: 'Missing required fields: orderId, userId, or total' },
        { status: 400 }
      );
    }

    const amountInCents = Math.round(parseFloat(total) * 100);

    if (amountInCents < 50) {
      return NextResponse.json(
        { error: 'Le montant minimum est de 0.50 €' },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        orderId: orderId.toString(),
        userId: userId.toString(),
        ...(metadata || {}),
      },
    });

    console.log('PaymentIntent created successfully:', {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret?.substring(0, 20) + '...',
      amount: paymentIntent.amount,
    });

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        stripe_payment_intent: paymentIntent.id,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order with PaymentIntent:', updateError);
    } else {
      console.log('Order updated with PaymentIntent ID:', orderId);
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });

  } catch (error: any) {
    console.error('Stripe PaymentIntent error:', {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
    });

    const errorMessage = error.message || 'Failed to create PaymentIntent';
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
