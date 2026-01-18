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
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (!orderId) {
          console.error('No orderId in session metadata');
          break;
        }

        // --- CORRECTION : Récupération de l'ID du moyen de paiement "Carte Bancaire" ---
        // On cherche le moyen de paiement qui s'appelle 'Carte Bancaire', 'Stripe' ou 'CB'
        // Assurez-vous d'avoir une méthode de ce nom dans votre table payment_methods
        let paymentMethodId = null;
        
        const { data: pmData } = await supabase
          .from('payment_methods')
          .select('id')
          .or('name.ilike.stripe,name.ilike.%carte%,name.ilike.%cb%') // Cherche "Stripe" OU "Carte..." OU "CB..."
          .limit(1)
          .single();

        if (pmData) {
            paymentMethodId = pmData.id;
        }
        // -------------------------------------------------------------------------------

        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed', // ou 'processing' selon votre logique métier
            paid_at: new Date().toISOString(),
            stripe_payment_intent: session.payment_intent as string,
            payment_method_id: paymentMethodId, // <--- ON AJOUTE CECI
            // On peut aussi forcer le nom en dur si le champ existe encore :
            payment_method: 'Carte Bancaire' 
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('Error updating order payment status:', updateError);
        } else {
          console.log(`Order ${orderId} marked as paid (Method ID: ${paymentMethodId})`);

          // ... (Le reste du code reste identique : Emails, Cashback, Coupons) ...
          
          const { data: orderDetails } = await supabase
            .from('orders')
            .select(`*, order_items (*, products (name, price)), addresses (street_address, city, postal_code, country), profiles (first_name, last_name, email)`)
            .eq('id', orderId)
            .single();

          if (orderDetails) {
            // ... (Logique coupons utilisés) ...
            if (orderDetails.coupon_code && orderDetails.user_id) {
               await supabase.rpc('mark_coupon_as_used', { p_code: orderDetails.coupon_code, p_user_id: orderDetails.user_id, p_order_id: orderId });
            }

            // ... (Envoi Email) ...
            if (orderDetails.profiles?.email) {
                // Logique envoi email...
                const items = orderDetails.order_items?.map((item: any) => ({ name: item.products?.name, quantity: item.quantity, price: item.price })) || [];
                await sendOrderConfirmationEmail(orderDetails.profiles.email, {
                    orderId: orderDetails.order_number || orderId,
                    customerName: `${orderDetails.profiles.first_name} ${orderDetails.profiles.last_name}`,
                    items,
                    total: orderDetails.total_amount,
                    shippingAddress: '...' 
                });
            }

            // ... (Logique Cashback & Coupons Croisés - inchangée) ...
            const userId = session.metadata?.userId;
            if (userId) {
                // Votre logique existante pour cashback et coupons...
                // (Je ne la répète pas ici pour faire court, mais gardez-la telle quelle !)
                 const cashbackAmount = orderDetails.subtotal * 0.02;
                 await supabase.rpc('add_loyalty_gain', { p_user_id: userId, p_type: 'order_cashback', p_base_amount: cashbackAmount, p_description: `Cashback commande ${orderDetails.order_number}` });
                 
                 // Création coupon croisé...
                 // ...
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
        // ... (Logique échec inchangée) ...
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}