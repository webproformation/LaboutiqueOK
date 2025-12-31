import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const WORDPRESS_URL = process.env.WORDPRESS_URL;
const WC_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const getAuthHeader = () => {
  const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
};

export async function GET() {
  try {
    if (!WORDPRESS_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      console.error('Missing WooCommerce configuration');
      return NextResponse.json(
        { error: 'Configuration WooCommerce manquante' },
        { status: 500 }
      );
    }

    let shippingMethods: any[] = [];

    console.log('Fetching shipping methods from Supabase...');
    console.log('Supabase URL:', supabaseUrl ? 'present' : 'missing');
    console.log('Supabase Anon Key:', supabaseAnonKey ? 'present' : 'missing');

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        const { data: shippingMethodsFromDb, error: shippingError } = await supabase
          .from('shipping_methods')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        console.log('Supabase response:', {
          data: shippingMethodsFromDb,
          error: shippingError,
          count: shippingMethodsFromDb?.length
        });

        if (shippingError) {
          console.error('Error fetching shipping methods from Supabase:', shippingError);
        } else if (shippingMethodsFromDb && shippingMethodsFromDb.length > 0) {
          shippingMethods = shippingMethodsFromDb.map((method) => ({
            id: method.code,
            zone_id: 1,
            zone_name: 'France',
            instance_id: method.id,
            method_id: method.code,
            title: method.name,
            cost: method.cost.toString(),
            description: method.description,
            is_relay: method.is_relay,
          }));
          console.log('Mapped shipping methods:', shippingMethods.length);
        } else {
          console.warn('No shipping methods found in database');
        }
      } catch (error) {
        console.error('Error accessing Supabase shipping methods:', error);
      }
    } else {
      console.error('Supabase configuration missing');
    }

    const [paymentResponse, taxResponse] = await Promise.all([
      fetch(`${WORDPRESS_URL}/wp-json/wc/v3/payment_gateways`, {
        headers: { 'Authorization': getAuthHeader() },
      }),
      fetch(`${WORDPRESS_URL}/wp-json/wc/v3/taxes`, {
        headers: { 'Authorization': getAuthHeader() },
      }),
    ]);

    const paymentGateways = paymentResponse.ok ? await paymentResponse.json() : [];
    const taxRates = taxResponse.ok ? await taxResponse.json() : [];

    const activePaymentGateways = Array.isArray(paymentGateways)
      ? paymentGateways.filter((gateway: any) => gateway.enabled)
      : [];

    return NextResponse.json({
      shippingMethods,
      paymentGateways: activePaymentGateways,
      taxRates,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
