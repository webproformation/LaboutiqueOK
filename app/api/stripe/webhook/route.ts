import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { sendOrderConfirmationEmail } from '@/lib/mail';

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

          const { data: orderDetails } = await supabase
            .from('orders')
            .select(`
              *,
              order_items (
                *,
                products (name, price)
              ),
              addresses (
                street_address,
                city,
                postal_code,
                country
              ),
              profiles (
                first_name,
                last_name,
                email
              )
            `)
            .eq('id', orderId)
            .single();

          if (orderDetails) {
            // Marquer le coupon comme utilisé si un coupon a été appliqué
            if (orderDetails.coupon_code && orderDetails.user_id) {
              try {
                const { error: couponError } = await supabase
                  .rpc('mark_coupon_as_used', {
                    p_code: orderDetails.coupon_code,
                    p_user_id: orderDetails.user_id,
                    p_order_id: orderId
                  });

                if (couponError) {
                  console.error('Error marking coupon as used:', couponError);
                } else {
                  console.log(`Coupon ${orderDetails.coupon_code} marked as used for order ${orderId}`);
                }
              } catch (couponErr) {
                console.error('Exception marking coupon as used:', couponErr);
              }
            }

            if (orderDetails.profiles?.email) {
              const items = orderDetails.order_items?.map((item: any) => ({
                name: item.products?.name || 'Produit',
                quantity: item.quantity,
                price: item.price,
              })) || [];

              const shippingAddress = orderDetails.addresses
                ? `${orderDetails.addresses.street_address}\n${orderDetails.addresses.postal_code} ${orderDetails.addresses.city}\n${orderDetails.addresses.country}`
                : 'Adresse non spécifiée';

              try {
                await sendOrderConfirmationEmail(orderDetails.profiles.email, {
                  orderId: orderDetails.order_number || orderId,
                  customerName: `${orderDetails.profiles.first_name || ''} ${orderDetails.profiles.last_name || ''}`.trim(),
                  items,
                  total: orderDetails.total_amount,
                  shippingAddress,
                });
                console.log(`Confirmation email sent to ${orderDetails.profiles.email}`);
              } catch (emailError) {
                console.error('Error sending confirmation email:', emailError);
              }
            }

            const userId = session.metadata?.userId;
            if (userId) {
              const cashbackAmount = orderDetails.subtotal * 0.02;

          try {
            const { data: loyaltyData, error: loyaltyError } = await supabase.rpc('add_loyalty_gain', {
              p_user_id: userId,
              p_type: 'order_cashback',
              p_base_amount: cashbackAmount,
              p_description: `Cashback commande ${orderDetails.order_number || orderId}`
            });

            if (loyaltyError) {
              console.error('Error adding cashback:', loyaltyError);
            } else {
              console.log(`Cashback added for order ${orderId}: ${cashbackAmount}€`);
            }
          } catch (loyaltyErr) {
            console.error('Exception adding cashback:', loyaltyErr);
          }

          const orderSource = session.metadata?.source || 'Site';
          const couponCategory = orderSource === 'Live' ? 'Site' : 'Live';
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 4);

          try {
            const couponCode = `CROSS-${orderId.substring(0, 8).toUpperCase()}`;

            const { error: couponError } = await supabase
              .from('coupons')
              .insert({
                code: couponCode,
                type: 'fixed',
                value: 2.0,
                is_global: false,
                category: couponCategory,
                valid_from: new Date().toISOString(),
                valid_until: expiresAt.toISOString(),
                is_active: true,
                description: `Coupon croisé: Commande ${orderSource} → Bonus ${couponCategory}`
              });

            if (couponError) {
              console.error('Error creating cross-sell coupon:', couponError);
            } else {
              const { error: userCouponError } = await supabase
                .from('user_coupons')
                .insert({
                  user_id: userId,
                  coupon_code: couponCode
                });

              if (userCouponError) {
                console.error('Error assigning coupon to user:', userCouponError);
              } else {
                console.log(`Cross-sell coupon ${couponCode} created and assigned (${orderSource} → ${couponCategory})`);
              }
            }
          } catch (couponErr) {
            console.error('Exception creating cross-sell coupon:', couponErr);
          }
            }
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
