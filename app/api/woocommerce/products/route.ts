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
    const productId = searchParams.get('id');
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '100';
    const search = searchParams.get('search') || '';

    if (action === 'list') {
      let wcUrl = `${WORDPRESS_URL}/wp-json/wc/v3/products?page=${page}&per_page=${perPage}`;
      if (search) {
        wcUrl += `&search=${encodeURIComponent(search)}`;
      }

      const response = await fetch(wcUrl, {
        headers: {
          'Authorization': getAuthHeader(),
        },
      });

      const products = await response.json();
      const totalPages = response.headers.get('X-WP-TotalPages');
      const totalItems = response.headers.get('X-WP-Total');

      return NextResponse.json({ products, totalPages, totalItems });
    }

    if (action === 'get' && productId) {
      const response = await fetch(
        `${WORDPRESS_URL}/wp-json/wc/v3/products/${productId}`,
        {
          headers: {
            'Authorization': getAuthHeader(),
          },
        }
      );

      const product = await response.json();
      return NextResponse.json(product);
    }

    if (action === 'all') {
      const response = await fetch(
        `${WORDPRESS_URL}/wp-json/wc/v3/products?per_page=100&status=any`,
        {
          headers: {
            'Authorization': getAuthHeader(),
          },
        }
      );

      const products = await response.json();
      return NextResponse.json(products);
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
    const { action, productData, productId, featured } = body;

    if (action === 'create') {
      const response = await fetch(
        `${WORDPRESS_URL}/wp-json/wc/v3/products`,
        {
          method: 'POST',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        }
      );

      const product = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Erreur WooCommerce', details: product },
          { status: response.status }
        );
      }

      return NextResponse.json(product);
    }

    if (action === 'draft' && productId) {
      const response = await fetch(
        `${WORDPRESS_URL}/wp-json/wc/v3/products/${productId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'draft' }),
        }
      );

      const product = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Erreur WooCommerce', details: product },
          { status: response.status }
        );
      }

      return NextResponse.json(product);
    }

    if (action === 'publish' && productId) {
      const response = await fetch(
        `${WORDPRESS_URL}/wp-json/wc/v3/products/${productId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'publish' }),
        }
      );

      const product = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Erreur WooCommerce', details: product },
          { status: response.status }
        );
      }

      return NextResponse.json(product);
    }

    if (action === 'toggleFeatured' && productId) {
      const response = await fetch(
        `${WORDPRESS_URL}/wp-json/wc/v3/products/${productId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': getAuthHeader(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ featured }),
        }
      );

      const product = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Erreur WooCommerce', details: product },
          { status: response.status }
        );
      }

      return NextResponse.json(product);
    }

    if (action === 'delete' && productId) {
      const response = await fetch(
        `${WORDPRESS_URL}/wp-json/wc/v3/products/${productId}?force=true`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': getAuthHeader(),
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Erreur lors de la suppression du produit', details: result },
          { status: response.status }
        );
      }

      return NextResponse.json(result);
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
    const { productId, productData } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'ID produit manquant' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/wc/v3/products/${productId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      }
    );

    const product = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Erreur WooCommerce', details: product },
        { status: response.status }
      );
    }

    return NextResponse.json(product);
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
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json(
        { error: 'ID produit manquant' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${WORDPRESS_URL}/wp-json/wc/v3/products/${productId}?force=true`,
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
