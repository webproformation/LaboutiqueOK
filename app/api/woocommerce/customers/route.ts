import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WORDPRESS_API_URL = 'https://laboutiquedemorgane.com/wp-json/wc/v3';
const CONSUMER_KEY = process.env.WC_CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.WC_CONSUMER_SECRET || '';

function getAuthHeader() {
  const credentials = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  return `Basic ${credentials}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '100';

    const response = await fetch(
      `${WORDPRESS_API_URL}/customers?page=${page}&per_page=${perPage}&orderby=registered_date&order=desc`,
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('WooCommerce API Error:', errorText);
      throw new Error(`WooCommerce API error: ${response.status}`);
    }

    const data = await response.json();
    const totalPages = response.headers.get('x-wp-totalpages') || '1';
    const total = response.headers.get('x-wp-total') || '0';

    return NextResponse.json({
      customers: data,
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        totalPages: parseInt(totalPages),
        total: parseInt(total),
      },
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
