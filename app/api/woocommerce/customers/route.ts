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
    const customerId = searchParams.get('id');
    const email = searchParams.get('email');
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '10';
    const search = searchParams.get('search') || '';

    if (action === 'list') {
      let wcUrl = `${WORDPRESS_URL}/wp-json/wc/v3/customers?page=${page}&per_page=${perPage}`;
      if (search) {
        wcUrl += `&search=${encodeURIComponent(search)}`;
      }
      if (email) {
        wcUrl += `&email=${encodeURIComponent(email)}`;
      }

      const response = await fetch(wcUrl, {
        headers: {
          'Authorization': getAuthHeader(),
        },
      });

      const customers = await response.json();
      const totalPages = response.headers.get('X-WP-TotalPages');
      const totalItems = response.headers.get('X-WP-Total');

      return NextResponse.json({ customers, totalPages, totalItems });
    }

    if (action === 'get' && customerId) {
      const response = await fetch(
        `${WORDPRESS_URL}/wp-json/wc/v3/customers/${customerId}`,
        {
          headers: {
            'Authorization': getAuthHeader(),
          },
        }
      );

      const customer = await response.json();
      return NextResponse.json(customer);
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
    const { action, customerData } = body;

    if (action === 'create') {
      const response = await fetch(
        `${WORDPRESS_URL}/wp-json/wc/v3/customers`,
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customerData),
        }
      );

      const customer = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Erreur WooCommerce', details: customer },
          { status: response.status }
        );
      }

      return NextResponse.json(customer);
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
    const { customerId, customerData } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'ID client manquant' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/wc/v3/customers/${customerId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      }
    );

    const customer = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erreur WooCommerce', details: customer },
        { status: response.status }
      );
    }

    return NextResponse.json(customer);
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
    const customerId = searchParams.get('id');

    if (!customerId) {
      return NextResponse.json(
        { error: 'ID client manquant' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/wc/v3/customers/${customerId}?force=true`,
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
