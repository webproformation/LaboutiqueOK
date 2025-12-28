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

    const body = await request.json();
    const { email, first_name, last_name } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email manquant' },
        { status: 400 }
      );
    }

    const checkResponse = await fetch(
      `${WORDPRESS_URL}/wp-json/wc/v3/customers?email=${encodeURIComponent(email)}`,
      {
        headers: {
          'Authorization': getAuthHeader(),
        },
      }
    );

    const existingCustomers = await checkResponse.json();

    if (existingCustomers && existingCustomers.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Client WooCommerce existe déjà',
        customer: existingCustomers[0]
      });
    }

    const createResponse = await fetch(
      `${WORDPRESS_URL}/wp-json/wc/v3/customers`,
      {
        method: 'POST',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          first_name: first_name || '',
          last_name: last_name || '',
        }),
      }
    );

    const newCustomer = await createResponse.json();

    if (!createResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la création du client', details: newCustomer },
        { status: createResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Client WooCommerce créé avec succès',
      customer: newCustomer
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
