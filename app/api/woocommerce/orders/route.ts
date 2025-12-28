import { NextRequest, NextResponse } from 'next/server';

const WORDPRESS_URL = process.env.WORDPRESS_URL;
const WC_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.WOOCOMMERCE_CONSUMER_SECRET;

const getAuthHeader = () => {
  const credentials = Buffer.from(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
};

export async function GET(request: NextRequest) {
  try {
    if (!WORDPRESS_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      return NextResponse.json(
        { error: 'Configuration WooCommerce manquante' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const orderId = searchParams.get('id');
    const customerId = searchParams.get('customer_id');
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '10';
    const status = searchParams.get('status') || '';

    if (action === 'list') {
      let wcUrl = `${WORDPRESS_URL}/wp-json/wc/v3/orders?page=${page}&per_page=${perPage}`;
      if (status) {
        wcUrl += `&status=${status}`;
      }
      if (customerId) {
        wcUrl += `&customer=${customerId}`;
      }

      const response = await fetch(wcUrl, {
        headers: {
          'Authorization': getAuthHeader(),
        },
      });

      const orders = await response.json();
      const totalPages = response.headers.get('X-WP-TotalPages');
      const totalItems = response.headers.get('X-WP-Total');

      return NextResponse.json({ orders, totalPages, totalItems });
    }

    if (action === 'get' && orderId) {
      const response = await fetch(
        `${WORDPRESS_URL}/wp-json/wc/v3/orders/${orderId}`,
        {
          headers: {
            'Authorization': getAuthHeader(),
          },
        }
      );

      const order = await response.json();
      return NextResponse.json(order);
    }

    return NextResponse.json(
      { error: 'Action invalide' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!WORDPRESS_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      return NextResponse.json(
        { error: 'Configuration WooCommerce manquante' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { action, orderData } = body;

    if (action === 'create') {
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

      const order = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Erreur WooCommerce', details: order },
          { status: response.status }
        );
      }

      return NextResponse.json(order);
    }

    return NextResponse.json(
      { error: 'Action invalide' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!WORDPRESS_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      return NextResponse.json(
        { error: 'Configuration WooCommerce manquante' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { orderId, orderData } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID commande manquant' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/wc/v3/orders/${orderId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      }
    );

    const order = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erreur WooCommerce', details: order },
        { status: response.status }
      );
    }

    return NextResponse.json(order);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!WORDPRESS_URL || !WC_CONSUMER_KEY || !WC_CONSUMER_SECRET) {
      return NextResponse.json(
        { error: 'Configuration WooCommerce manquante' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID commande manquant' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/wc/v3/orders/${orderId}?force=true`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': getAuthHeader(),
        },
      }
    );

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
