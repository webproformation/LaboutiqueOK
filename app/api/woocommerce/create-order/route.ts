import { NextRequest, NextResponse } from 'next/server';

const WORDPRESS_URL = process.env.WORDPRESS_URL;
const WC_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

const getAuthHeader = () => {
  const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
};

export async function POST(request: NextRequest) {
  try {
    if (!WORDPRESS_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Configuration WooCommerce manquante' },
        { status: 500 }
      );
    }

    const orderData = await request.json();

    console.log('Creating WooCommerce order with data:', JSON.stringify(orderData, null, 2));

    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/wc/v3/orders`,
      {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('WooCommerce order creation failed:', {
        status: response.status,
        error: result
      });
      return NextResponse.json(
        { success: false, error: 'Erreur WooCommerce', details: result },
        { status: response.status }
      );
    }

    console.log('WooCommerce order created successfully:', result.id);

    return NextResponse.json({
      success: true,
      order: result
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
