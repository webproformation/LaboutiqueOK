import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const WORDPRESS_URL = Deno.env.get('WORDPRESS_URL');
const WC_CONSUMER_KEY = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
const WC_CONSUMER_SECRET = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');

const getAuthHeader = () => {
  const credentials = btoa(`${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`);
  return `Basic ${credentials}`;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const orderId = url.searchParams.get('id');

    if (action === 'list') {
      const page = url.searchParams.get('page') || '1';
      const perPage = url.searchParams.get('per_page') || '10';
      const status = url.searchParams.get('status') || '';

      let wcUrl = `${WORDPRESS_URL}/wp-json/wc/v3/orders?page=${page}&per_page=${perPage}`;
      if (status) wcUrl += `&status=${status}`;

      const response = await fetch(wcUrl, { headers: { 'Authorization': getAuthHeader() } });
      const orders = await response.json();

      return new Response(
        JSON.stringify({ orders, totalPages: response.headers.get('X-WP-TotalPages'), totalItems: response.headers.get('X-WP-Total') }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get' && orderId) {
      const response = await fetch(`${WORDPRESS_URL}/wp-json/wc/v3/orders/${orderId}`, {
        headers: { 'Authorization': getAuthHeader() }
      });
      return new Response(JSON.stringify(await response.json()), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'update' && orderId && req.method === 'PUT') {
      const orderData = await req.json();
      const response = await fetch(`${WORDPRESS_URL}/wp-json/wc/v3/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Authorization': getAuthHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      return new Response(JSON.stringify(await response.json()), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});