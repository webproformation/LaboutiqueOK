import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmationEmail } from '@/lib/mail';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function generateAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderID, dbOrderId } = body;

    if (!orderID) {
      return NextResponse.json(
        { error: 'Missing PayPal order ID' },
        { status: 400 }
      );
    }

    const accessToken = await generateAccessToken();

    const captureResponse = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderID}/capture`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const captureData = await captureResponse.json();

    if (!captureResponse.ok) {
      console.error('PayPal capture failed:', captureData);
      return NextResponse.json(
        { error: 'Failed to capture PayPal order', details: captureData },
        { status: 500 }
      );
    }

    if (dbOrderId) {
      // --- AJOUT : Récupération de l'ID du moyen de paiement "PayPal" ---
      let paymentMethodId = null;
      const { data: pmData } = await supabase
        .from('payment_methods')
        .select('id')
        .ilike('name', '%paypal%') // Cherche un nom contenant "paypal" (insensible à la casse)
        .limit(1)
        .single();

      if (pmData) {
        paymentMethodId = pmData.id;
      }
      // ------------------------------------------------------------------

      await supabase
        .from('orders')
        .update({
          paypal_order_id: orderID,
          paypal_capture_id: captureData.purchase_units?.[0]?.payments?.captures?.[0]?.id,
          payment_status: 'paid', // Harmonisé avec Stripe (était 'completed')
          status: 'confirmed',    // Harmonisé avec Stripe (était order_status: 'processing') - Vérifiez si votre colonne s'appelle 'status' ou 'order_status'
          // J'ai laissé les deux cas ci-dessous pour être sûr que ça marche selon votre base :
          order_status: 'processing', 
          
          // --- AJOUTS IMPORTANTS POUR LA FACTURE ---
          payment_method_id: paymentMethodId,
          payment_method: 'PayPal' 
        })
        .eq('id', dbOrderId);

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
        .eq('id', dbOrderId)
        .single();

      if (orderDetails) {
        // Marquer le coupon comme utilisé si un coupon a été appliqué
        if (orderDetails.coupon_code && orderDetails.user_id) {
          try {
            const { error: couponError } = await supabase
              .rpc('mark_coupon_as_used', {
                p_code: orderDetails.coupon_code,
                p_user_id: orderDetails.user_id,
                p_order_id: dbOrderId
              });

            if (couponError) {
              console.error('Error marking coupon as used:', couponError);
            } else {
              console.log(`Coupon ${orderDetails.coupon_code} marked as used for PayPal order ${dbOrderId}`);
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
              orderId: orderDetails.order_number || dbOrderId,
              customerName: `${orderDetails.profiles.first_name || ''} ${orderDetails.profiles.last_name || ''}`.trim(),
              items,
              total: orderDetails.total_amount,
              shippingAddress,
            });
            console.log(`Confirmation email sent to ${orderDetails.profiles.email} for PayPal order`);
          } catch (emailError) {
            console.error('Error sending PayPal confirmation email:', emailError);
          }